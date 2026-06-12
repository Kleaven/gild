'use server';

import { z } from 'zod';
import { getSupabaseServerClient } from '../auth/server';
import { checkRateLimit } from '../rate-limit/index';
import { getMemberLimit } from '../billing/gates';
import type { Database } from '../supabase/types';
import type { CreateCommunityInput, UpdateMemberRoleInput } from './types';

type Json = Database['public']['Tables']['communities']['Row']['role_permissions'];

const createCommunitySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^(?=.*[a-z0-9])[a-z0-9-]+$/, 'slug must contain letters or numbers and use hyphens only'),
  description: z.string().max(500).optional(),
  is_private: z.boolean().optional().default(false),
  category: z.string().optional(),
  theme_hue: z.number().min(0).max(360).optional(),
  welcome_message: z.string().max(2000).optional(),
  goodbye_message: z.string().max(2000).optional(),
  pricing_type: z.enum(['free', 'paid']).optional().default('free'),
  price_amount: z.number().min(0).optional().default(0),
  price_currency: z.string().optional().default('USD'),
  pricing_period: z.enum(['one_time', 'monthly', 'yearly']).optional().default('one_time'),
});

const updateMemberRoleSchema = z.object({
  communityId: z.string().uuid(),
  targetUserId: z.string().uuid(),
  newRole: z.enum(['admin', 'moderator', 'tier2_member', 'tier1_member', 'free_member', 'banned']),
});

// Discriminated union return.
// Throws are reserved for UNEXPECTED failure modes (auth corruption, RLS
// denial, network errors, schema bugs) that warrant a 500. Predictable
// business-rule failures (paywall, slug collision, rate limit) return
// { ok: false, code: ... } so the form can render a meaningful CTA
// instead of Next.js wrapping a thrown Error as a generic 500 with the
// message stripped in production builds.
export type CreateCommunityResult =
  | { ok: true; communityId: string }
  | { ok: false; code: 'subscription_required'; message: string }
  | { ok: false; code: 'slug_taken'; message: string }
  | { ok: false; code: 'rate_limited'; message: string }
  | { ok: false; code: 'validation_failed'; message: string };

export async function createCommunity(
  input: CreateCommunityInput,
): Promise<CreateCommunityResult> {
  const parsed = createCommunitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'validation_failed',
      message: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }
  const { name, slug, description, is_private, category, theme_hue, welcome_message, goodbye_message, pricing_type, price_amount, price_currency, pricing_period } = parsed.data;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  // Auth failure is genuinely unexpected here — the wrapper already
  // verifies the session before we get called. Throwing keeps the
  // existing surface for missing-session bugs.
  if (authError || !user) throw new Error('[gild] not authenticated');

  const rl = await checkRateLimit(user.id, 'community_create', 5, 3600);
  if (!rl.allowed) {
    return {
      ok: false,
      code: 'rate_limited',
      message: 'You have hit the community creation rate limit. Try again in an hour.',
    };
  }

  // Paywall — the most common reason a real user hits this Server Action
  // and fails. Surfacing as a structured response lets the form render an
  // "Upgrade →" CTA instead of crashing to a generic 500.
  const { data: hasSubscription } = await supabase.rpc('has_platform_subscription', {
    p_user_id: user.id,
  });
  if (!hasSubscription) {
    return {
      ok: false,
      code: 'subscription_required',
      message: 'A valid Gild subscription is required to create a community.',
    };
  }

  const { data: communityId, error } = await supabase.rpc('create_community', {
    p_name: name,
    p_slug: slug,
    p_description: description,
    p_is_private: is_private,
    p_category: category,
    p_theme_hue: theme_hue,
    p_welcome_message: welcome_message,
    p_goodbye_message: goodbye_message,
    p_pricing_type: pricing_type,
    p_price_amount: price_amount,
    p_price_currency: price_currency,
    p_pricing_period: pricing_period,
  });
  if (error) {
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return {
        ok: false,
        code: 'slug_taken',
        message: 'This URL slug is already taken. Please choose another.',
      };
    }
    // Any other DB error is unexpected — let Next surface it as a 500
    // so it shows up in monitoring/logs as something to investigate.
    throw new Error(error.message);
  }

  return { ok: true, communityId: communityId as string };
}

// Discriminated union — mirrors the pattern in createCommunity /
// deleteCommunity. Predictable join failures (already a member, banned,
// private without invite, plan member-limit, community deleted/hidden)
// return structured data so JoinGate / JoinButton can render an inline
// message. Unexpected errors still throw → 500 in monitoring.
export type JoinCommunityResult =
  | { ok: true; name: string; welcome_message: string | null }
  | { ok: false; code: 'not_found'; message: string }
  | { ok: false; code: 'already_member'; message: string }
  | { ok: false; code: 'banned'; message: string }
  | { ok: false; code: 'private_invite_required'; message: string }
  | { ok: false; code: 'member_limit_reached'; message: string };

export async function joinCommunity(
  communityId: string,
  inviteToken?: string | null,
): Promise<JoinCommunityResult> {
  const supabase = await getSupabaseServerClient();
  const { data: communityData, error: fetchError } = await supabase
    .from('communities')
    .select('plan, member_count, name, welcome_message')
    .eq('id', communityId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!communityData) {
    return {
      ok: false,
      code: 'not_found',
      message: 'This community no longer exists or you no longer have access to it.',
    };
  }

  const limit = getMemberLimit(communityData.plan as any);
  if (communityData.member_count >= limit) {
    return {
      ok: false,
      code: 'member_limit_reached',
      message: `This community has reached its member limit of ${limit} for the current plan.`,
    };
  }

  // p_invite_token defaults to NULL in the RPC — passing undefined or null
  // skips the token-redemption branch and only works for public communities.
  // Passing a valid token bypasses the private-community gate AND increments
  // the link's `uses` counter.
  const { error } = await supabase.rpc('join_community', {
    p_community_id: communityId,
    p_invite_token: inviteToken ?? undefined,
  });

  if (error) {
    // join_community RPC raises specific messages we want to surface
    // inline as structured codes rather than throwing.
    const m = error.message;
    if (m.includes('already a member')) {
      return {
        ok: false,
        code: 'already_member',
        message: 'You are already a member of this community.',
      };
    }
    if (m.includes('banned')) {
      return {
        ok: false,
        code: 'banned',
        message: 'You are banned from this community and cannot rejoin.',
      };
    }
    if (m.includes('private')) {
      return {
        ok: false,
        code: 'private_invite_required',
        message: 'This community is private. You need an invitation to join.',
      };
    }
    // Unexpected DB / RLS error — re-raise as 500 for monitoring.
    throw new Error(m);
  }

  return {
    ok: true,
    name: communityData.name ?? 'Community',
    welcome_message: communityData.welcome_message,
  };
}

export async function leaveCommunity(communityId: string): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.rpc('leave_community', {
    p_community_id: communityId,
  });
  if (error) throw new Error(error.message);
}

export async function updateMemberRole(input: UpdateMemberRoleInput): Promise<void> {
  const parsed = updateMemberRoleSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const { communityId, targetUserId, newRole } = parsed.data;

  const supabase = await getSupabaseServerClient();

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: communityId,
    p_min_role: 'admin',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] insufficient permissions to update member role');

  const { error } = await supabase.rpc('update_member_role', {
    p_community_id: communityId,
    p_user_id: targetUserId,
    p_new_role: newRole,
  });
  if (error) throw new Error(error.message);
}

export async function transferOwnership(
  communityId: string,
  newOwnerId: string,
): Promise<void> {
  const supabase = await getSupabaseServerClient();

  const { data: isOwner, error: ownerError } = await supabase.rpc('is_community_owner', {
    p_community_id: communityId,
  });
  if (ownerError) throw new Error(ownerError.message);
  if (!isOwner) throw new Error('[gild] only the community owner can transfer ownership');

  const { error } = await supabase.rpc('transfer_community_ownership', {
    p_community_id: communityId,
    p_new_owner_id: newOwnerId,
  });
  if (error) throw new Error(error.message);
}

// ─── Community update / delete: strict input shape + role gate ──────────────
// Schema lives here (not in the wrapper) so any caller path — including any
// future internal code that bypasses app/actions — is forced through both
// the Zod validation AND the role check. Defense-in-depth: the RLS policy
// on communities.UPDATE already gates to is_community_owner OR platform
// admin, but we re-prove the role at the app layer so a future RLS
// loosening cannot silently widen the blast radius.

const updateCommunitySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  theme_hue: z.number().int().min(0).max(360).optional(),
  logo_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  is_private: z.boolean().optional(),
  category: z.string().max(80).nullable().optional(),
  // role_permissions is a JSONB blob; Zod-validate the outer shape (an
  // object) but keep value types loose until a dedicated permission schema
  // is built. Rejects strings, arrays, primitives.
  role_permissions: z.record(z.string(), z.unknown()).optional(),
  welcome_message: z.string().max(2000).nullable().optional(),
  goodbye_message: z.string().max(2000).nullable().optional(),
  // Join pricing — what JoinGate charges new members. Editable post-creation
  // (previously only settable during onboarding, leaving owners stuck).
  pricing_type: z.enum(['free', 'paid']).optional(),
  price_amount: z.number().min(0).max(100000).optional(),
  pricing_period: z.enum(['one_time', 'monthly', 'yearly']).optional(),
}).strict();

export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;

// Same pattern as createCommunity / deleteCommunity / joinCommunity.
// Predictable failures (Zod validation, ownership check) return
// structured codes so the settings save flow can render an inline
// error instead of crashing to a generic 500 with the message stripped.
// Unexpected DB errors still throw → 500 in monitoring.
export type UpdateCommunityResult =
  | { ok: true }
  | { ok: false; code: 'validation_failed'; message: string }
  | { ok: false; code: 'insufficient_permissions'; message: string };

export async function updateCommunity(
  communityId: string,
  input: UpdateCommunityInput,
): Promise<UpdateCommunityResult> {
  const parsed = updateCommunitySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: 'validation_failed',
      message: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  const supabase = await getSupabaseServerClient();

  // Use is_community_owner (NOT user_has_min_role('admin')) so the app-layer
  // check agrees with the RLS policy on communities.UPDATE. The two helpers
  // check different things — user_has_min_role reads community_members.role,
  // is_community_owner reads communities.owner_id — and they can desync.
  // Same divergence broke deleteCommunity at commit e35fb2f.
  const { data: isOwner, error: roleError } = await supabase.rpc('is_community_owner', {
    p_community_id: communityId,
  });
  if (roleError) throw new Error(roleError.message);
  if (!isOwner) {
    return {
      ok: false,
      code: 'insufficient_permissions',
      message: 'Only the community owner can update these settings.',
    };
  }

  const { error } = await supabase
    .from('communities')
    .update({
      ...(parsed.data.name !== undefined && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.theme_hue !== undefined && { theme_hue: parsed.data.theme_hue }),
      ...(parsed.data.logo_url !== undefined && { logo_url: parsed.data.logo_url }),
      ...(parsed.data.banner_url !== undefined && { banner_url: parsed.data.banner_url }),
      ...(parsed.data.is_private !== undefined && { is_private: parsed.data.is_private }),
      ...(parsed.data.category !== undefined && { category: parsed.data.category }),
      ...(parsed.data.pricing_type !== undefined && { pricing_type: parsed.data.pricing_type }),
      ...(parsed.data.price_amount !== undefined && { price_amount: parsed.data.price_amount }),
      ...(parsed.data.pricing_period !== undefined && { pricing_period: parsed.data.pricing_period }),
      // role_permissions is a JSONB blob — Zod validates the outer object
      // shape, then we cast to the Supabase Json type at the boundary.
      ...(parsed.data.role_permissions !== undefined && { role_permissions: parsed.data.role_permissions as Json }),
      ...(parsed.data.welcome_message !== undefined && { welcome_message: parsed.data.welcome_message }),
      ...(parsed.data.goodbye_message !== undefined && { goodbye_message: parsed.data.goodbye_message }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', communityId);

  if (error) {
    // RLS denial — surface as structured. Defense-in-depth: we already
    // ran the is_community_owner check above, but if a future migration
    // tightens the RLS policy in a way that diverges from that check,
    // we'd rather show "insufficient permissions" than crash.
    if (error.message.includes('row-level security')) {
      return {
        ok: false,
        code: 'insufficient_permissions',
        message: 'Only the community owner can update these settings.',
      };
    }
    // Anything else is genuinely unexpected.
    throw new Error(error.message);
  }

  return { ok: true };
}

// Discriminated union return — same pattern as createCommunity. The
// "you're not the owner" branch is a predictable business-rule failure
// (e.g. an admin sees the settings page and clicks Delete) and must
// surface inline, not as a Next.js 500 with the message stripped.
// Genuine DB / RLS errors still throw so they show up in monitoring.
export type DeleteCommunityResult =
  | { ok: true }
  | { ok: false; code: 'insufficient_permissions'; message: string };

export async function deleteCommunity(communityId: string): Promise<DeleteCommunityResult> {
  const supabase = await getSupabaseServerClient();

  // Route through the delete_community SECURITY DEFINER RPC. Direct
  // UPDATE-from-the-client fails RLS because the SELECT policies on
  // communities filter `deleted_at IS NULL` — the post-UPDATE row is
  // immediately invisible to the caller, and Postgres reports this as
  // a generic "new row violates row-level security policy". The RPC
  // runs as the function owner, bypasses RLS on the table, and keeps
  // the auth check (owner OR platform admin) inside the function body.
  // See migration 20260518000003_delete_community_rpc.sql for the
  // full rationale and authorization model.
  const { error } = await supabase.rpc('delete_community', {
    p_community_id: communityId,
  });

  if (error) {
    if (error.message.includes('insufficient_permissions')) {
      return {
        ok: false,
        code: 'insufficient_permissions',
        message: 'Only the community owner can delete this community.',
      };
    }
    // Anything else — re-raise so it surfaces as a 500 in monitoring.
    throw new Error(error.message);
  }

  return { ok: true };
}
