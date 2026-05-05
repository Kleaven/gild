import 'server-only';
import db from '../db';
import { FEATURE_FLAGS, type FlagName } from '../feature-flags/flags';

export type AdminStats = {
  totalCommunities: number;
  totalUsers: number;
  hobbyCount: number;
  proCount: number;
  trialingCount: number;
  activeCount: number;
  pastDueCount: number;
};

export type AdminCommunityRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  ownerEmail: string | null;
  memberCount: number;
};

type StatsRow = {
  total_communities: number;
  total_users: number;
  hobby_count: number;
  pro_count: number;
  trialing_count: number;
  active_count: number;
  past_due_count: number;
};

type CommunityQueryRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  subscription_status: string | null;
  trial_ends_at: string | null;
  created_at: string;
  owner_email: string | null;
  member_count: number;
};

type GlobalFlagRow = {
  flag_name: string;
  is_enabled: boolean;
};

type OverrideRow = {
  community_id: string;
  community_name: string;
  is_enabled: boolean;
};

export async function getAdminStats(): Promise<AdminStats> {
  const rows = await db<StatsRow[]>`
    SELECT
      (SELECT count(*) FROM communities)::int                          AS total_communities,
      (SELECT count(*) FROM profiles)::int                             AS total_users,
      (SELECT count(*) FROM communities WHERE plan = 'hobby')::int     AS hobby_count,
      (SELECT count(*) FROM communities WHERE plan = 'pro')::int       AS pro_count,
      (SELECT count(*) FROM communities
       WHERE subscription_status = 'trialing')::int                    AS trialing_count,
      (SELECT count(*) FROM communities
       WHERE subscription_status = 'active')::int                      AS active_count,
      (SELECT count(*) FROM communities
       WHERE subscription_status = 'past_due')::int                    AS past_due_count
  `;
  const row = rows[0];
  if (!row) {
    return {
      totalCommunities: 0, totalUsers: 0, hobbyCount: 0, proCount: 0,
      trialingCount: 0, activeCount: 0, pastDueCount: 0,
    };
  }
  return {
    totalCommunities: Number(row.total_communities),
    totalUsers: Number(row.total_users),
    hobbyCount: Number(row.hobby_count),
    proCount: Number(row.pro_count),
    trialingCount: Number(row.trialing_count),
    activeCount: Number(row.active_count),
    pastDueCount: Number(row.past_due_count),
  };
}

export async function getAdminCommunities(
  search: string | null,
): Promise<AdminCommunityRow[]> {
  const pattern = search ? `%${search}%` : null;
  const rows = await db<CommunityQueryRow[]>`
    SELECT
      c.id,
      c.name,
      c.slug,
      c.plan,
      c.subscription_status,
      c.trial_ends_at,
      c.created_at,
      p.email AS owner_email,
      (SELECT count(*)::int FROM community_members cm
       WHERE cm.community_id = c.id
         AND cm.role != 'banned') AS member_count
    FROM communities c
    LEFT JOIN community_members owner_cm
      ON owner_cm.community_id = c.id
     AND owner_cm.role = 'owner'
    LEFT JOIN profiles p
      ON p.id = owner_cm.user_id
    WHERE (${pattern} IS NULL
      OR c.name ILIKE ${pattern}
      OR c.slug ILIKE ${pattern})
    ORDER BY c.created_at DESC
    LIMIT 200
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    plan: row.plan,
    subscriptionStatus: row.subscription_status,
    trialEndsAt: row.trial_ends_at,
    createdAt: row.created_at,
    ownerEmail: row.owner_email,
    memberCount: Number(row.member_count),
  }));
}

export async function getGlobalFlags(): Promise<Record<FlagName, boolean>> {
  const rows = await db<GlobalFlagRow[]>`
    SELECT flag_name, is_enabled
    FROM feature_flags
    WHERE community_id IS NULL
  `;
  const dbMap = new Map<string, boolean>();
  for (const row of rows) {
    dbMap.set(row.flag_name, row.is_enabled);
  }
  const result = {} as Record<FlagName, boolean>;
  for (const key of Object.keys(FEATURE_FLAGS) as FlagName[]) {
    result[key] = dbMap.has(key) ? (dbMap.get(key) as boolean) : FEATURE_FLAGS[key].default;
  }
  return result;
}

export async function getCommunityOverridesForFlag(
  flagName: string,
): Promise<Array<{ communityId: string; communityName: string; enabled: boolean }>> {
  const rows = await db<OverrideRow[]>`
    SELECT f.community_id, f.is_enabled, c.name AS community_name
    FROM feature_flags f
    JOIN communities c ON c.id = f.community_id
    WHERE f.community_id IS NOT NULL
      AND f.flag_name = ${flagName}
    ORDER BY c.name ASC
  `;
  return rows.map((row) => ({
    communityId: row.community_id,
    communityName: row.community_name,
    enabled: row.is_enabled,
  }));
}
