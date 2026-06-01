import 'server-only';

import db from '../db';
import type { TierGating, ModuleTierRequirement } from './progress';

// Builds the tier-gating context for a course: the caller's active tier rank
// and each module's required tier. Reads the member's own membership row and
// the module → tier links. A member's tier only counts while active/trialing.
export async function getCourseTierGating(
  communityId: string,
  userId: string | null,
  moduleIds: string[],
): Promise<TierGating> {
  let memberTierPosition: number | null = null;
  if (userId) {
    const rows = await db<
      { tier_status: string | null; position: number | null; tier_current_period_end: string | null }[]
    >`
      SELECT cm.tier_status, mt.position, cm.tier_current_period_end
      FROM public.community_members cm
      LEFT JOIN public.membership_tiers mt ON mt.id = cm.tier_id
      WHERE cm.community_id = ${communityId} AND cm.user_id = ${userId}
      LIMIT 1
    `;
    const r = rows[0];
    const statusActive = r?.tier_status === 'active' || r?.tier_status === 'trialing';
    // A scheduled cancellation (period end set) revokes access once it passes —
    // a hard expiry that holds even if no webhook ever arrives.
    const notExpired =
      !r?.tier_current_period_end || new Date(r.tier_current_period_end).getTime() > Date.now();
    if (r && statusActive && notExpired && r.position !== null) {
      memberTierPosition = r.position;
    }
  }

  const moduleTier: Record<string, ModuleTierRequirement | null> = {};
  for (const id of moduleIds) moduleTier[id] = null;

  if (moduleIds.length > 0) {
    const rows = await db<
      { id: string; tier_id: string | null; name: string | null; position: number | null }[]
    >`
      SELECT m.id, m.min_tier_id AS tier_id, mt.name, mt.position
      FROM public.modules m
      LEFT JOIN public.membership_tiers mt ON mt.id = m.min_tier_id
      WHERE m.id = ANY(${moduleIds})
    `;
    for (const r of rows) {
      moduleTier[r.id] =
        r.tier_id && r.name !== null && r.position !== null
          ? { id: r.tier_id, name: r.name, position: r.position }
          : null;
    }
  }

  return { memberTierPosition, moduleTier };
}
