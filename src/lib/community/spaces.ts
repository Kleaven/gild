// server-only — do not import from client components
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/types';
import { getSupabaseServerClient } from '../auth/server';
import { hasMinRole, type MemberRole } from '../permissions/roles';
import type { Space, CreateSpaceInput, UpdateSpaceInput } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getSpaces(
  supabase: SupabaseClient<Database>,
  communityId: string,
): Promise<Space[]> {
  const { data: roleData } = await supabase.rpc('current_user_role', {
    p_community_id: communityId,
  });
  const userRole = roleData as MemberRole | null;

  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('community_id', communityId)
    .is('deleted_at', null)
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);

  if (!userRole) return [];

  // Filter client-side: role hierarchy from lib/permissions — not hand-rolled
  return (data ?? []).filter((s) => hasMinRole(userRole, s.min_role as MemberRole));
}

export async function getSpace(
  supabase: SupabaseClient<Database>,
  spaceId: string,
): Promise<Space | null> {
  const { data: space, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', spaceId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!space) return null;

  const { data: roleData } = await supabase.rpc('current_user_role', {
    p_community_id: space.community_id,
  });
  const userRole = roleData as MemberRole | null;
  if (!userRole) return null;

  // Role hierarchy check from lib/permissions
  if (!hasMinRole(userRole, space.min_role as MemberRole)) return null;

  return space;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

const SPACE_TYPES = ['feed', 'course', 'events', 'members', 'chat'] as const;
const MEMBER_ROLES = [
  'owner',
  'admin',
  'moderator',
  'tier2_member',
  'tier1_member',
  'free_member',
  'banned',
] as const;

const createSpaceSchema = z.object({
  communityId: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/).optional(),
  type: z.enum(SPACE_TYPES),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().default(false),
  minRole: z.enum(MEMBER_ROLES).default('free_member'),
});

const updateSpaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPrivate: z.boolean().optional(),
  minRole: z.enum(MEMBER_ROLES).optional(),
});

export async function createSpace(
  input: CreateSpaceInput,
): Promise<{ spaceId: string }> {
  'use server';

  const parsed = createSpaceSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const { communityId, name, type, description, isPrivate, minRole, slug } = parsed.data;

  const supabase = await getSupabaseServerClient();

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: communityId,
    p_min_role: 'admin',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] must be admin to create spaces');

  const resolvedSlug = slug ?? nameToSlug(name);

  const { data: space, error } = await supabase
    .from('spaces')
    .insert({
      community_id: communityId,
      name,
      slug: resolvedSlug,
      type,
      description: description ?? null,
      is_private: isPrivate,
      min_role: minRole,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);

  return { spaceId: space.id };
}

export async function updateSpace(
  spaceId: string,
  input: UpdateSpaceInput,
): Promise<void> {
  'use server';

  const parsed = updateSpaceSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }

  const supabase = await getSupabaseServerClient();

  const { data: space, error: fetchError } = await supabase
    .from('spaces')
    .select('community_id')
    .eq('id', spaceId)
    .is('deleted_at', null)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!space) throw new Error('[gild] space not found');

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: space.community_id,
    p_min_role: 'admin',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] must be admin to update spaces');

  type SpaceUpdate = Database['public']['Tables']['spaces']['Update'];
  const updates: SpaceUpdate = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.isPrivate !== undefined) updates.is_private = parsed.data.isPrivate;
  if (parsed.data.minRole !== undefined) updates.min_role = parsed.data.minRole;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from('spaces').update(updates).eq('id', spaceId);
  if (error) throw new Error(error.message);
}

export async function deleteSpace(spaceId: string): Promise<void> {
  'use server';

  const supabase = await getSupabaseServerClient();

  const { data: space, error: fetchError } = await supabase
    .from('spaces')
    .select('community_id')
    .eq('id', spaceId)
    .is('deleted_at', null)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!space) throw new Error('[gild] space not found');

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: space.community_id,
    p_min_role: 'admin',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] must be admin to delete spaces');

  // Soft delete only — never hard DELETE
  const { error } = await supabase
    .from('spaces')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', spaceId);
  if (error) throw new Error(error.message);
}

export async function reorderSpaces(
  communityId: string,
  orderedSpaceIds: string[],
): Promise<void> {
  'use server';

  const supabase = await getSupabaseServerClient();

  const { data: hasRole, error: roleError } = await supabase.rpc('user_has_min_role', {
    p_community_id: communityId,
    p_min_role: 'admin',
  });
  if (roleError) throw new Error(roleError.message);
  if (!hasRole) throw new Error('[gild] must be admin to reorder spaces');

  // Validate no duplicate IDs
  if (new Set(orderedSpaceIds).size !== orderedSpaceIds.length) {
    throw new Error('[gild] duplicate space IDs in orderedSpaceIds');
  }

  // Validate ALL IDs belong to communityId before any writes
  const { data: existing, error: fetchError } = await supabase
    .from('spaces')
    .select('id')
    .eq('community_id', communityId)
    .in('id', orderedSpaceIds);
  if (fetchError) throw new Error(fetchError.message);

  if ((existing?.length ?? 0) !== orderedSpaceIds.length) {
    throw new Error('[gild] one or more space IDs do not belong to this community');
  }

  // Batch update positions
  const results = await Promise.all(
    orderedSpaceIds.map((spaceId, index) =>
      supabase
        .from('spaces')
        .update({ position: index })
        .eq('id', spaceId)
        .eq('community_id', communityId),
    ),
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}
