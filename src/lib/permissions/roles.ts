// server-only — do not import from client components

export const ROLE_HIERARCHY = [
  'banned',
  'free_member',
  'tier1_member',
  'tier2_member',
  'moderator',
  'admin',
  'owner',
] as const;

export type MemberRole = (typeof ROLE_HIERARCHY)[number];

export function getRoleIndex(role: MemberRole): number {
  return ROLE_HIERARCHY.indexOf(role);
}

export function hasMinRole(userRole: MemberRole, minRole: MemberRole): boolean {
  return getRoleIndex(userRole) >= getRoleIndex(minRole);
}
