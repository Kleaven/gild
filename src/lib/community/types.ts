// server-only — do not import from client components
import type { Database } from '../supabase/types';

export type Community = Database['public']['Tables']['communities']['Row'];
export type CommunityMember = Database['public']['Tables']['community_members']['Row'];
export type MembershipTier = Database['public']['Tables']['membership_tiers']['Row'];
export type Space = Database['public']['Tables']['spaces']['Row'];

export type MemberProfile = {
  user_id: string;
  role: Database['public']['Enums']['member_role'];
  joined_at: string;
  display_name: string;
  avatar_url: string | null;
  username: string | null;
};

// 'owner' excluded — ownership transfer uses transfer_community_ownership RPC
export type AssignableRole = Exclude<Database['public']['Enums']['member_role'], 'owner'>;

export type CreateCommunityInput = {
  name: string;
  slug: string;
  description?: string;
};

export type UpdateMemberRoleInput = {
  communityId: string;
  targetUserId: string;
  newRole: AssignableRole;
};

export type CreateSpaceInput = {
  communityId: string;
  name: string;
  type: Database['public']['Enums']['space_type'];
  description?: string;
  isPrivate?: boolean;
  minRole?: Database['public']['Enums']['member_role'];
  slug?: string;
};

export type UpdateSpaceInput = {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  minRole?: Database['public']['Enums']['member_role'];
};
