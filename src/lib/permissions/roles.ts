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

export function normalizeRole(role: string | null | undefined): MemberRole {
  if (!role) return 'free_member';
  if (role === 'member') return 'free_member';
  if (ROLE_HIERARCHY.includes(role as MemberRole)) return role as MemberRole;
  return 'free_member';
}

// ─── Action permission resolver ──────────────────────────────────────────────
// Single source of truth for "can this role do this action here?". Handles
// BOTH permission shapes that exist in the wild:
//   group shape  — { member: { can_post: false }, admin: { can_post: true } }
//                  (what RolePermissionsEditor and SpaceSettingsModal save)
//   legacy shape — { post: 'moderator' }  (minimum-role-name per action)
// Owner always passes; banned never does; unset means allowed.

export type PermAction = 'post' | 'comment' | 'react' | 'invite';

export function canRolePerform(
  perms: unknown,
  role: string | null | undefined,
  action: PermAction,
): boolean {
  const r = normalizeRole(role);
  if (r === 'banned') return false;
  if (r === 'owner') return true;

  const p = (perms && typeof perms === 'object' ? perms : {}) as Record<string, unknown>;

  const group = r === 'admin' || r === 'moderator' ? 'admin' : 'member';
  const groupPerms = p[group];
  if (groupPerms && typeof groupPerms === 'object') {
    const v = (groupPerms as Record<string, unknown>)[`can_${action}`];
    if (typeof v === 'boolean') return v;
  }

  const legacy = p[action];
  if (typeof legacy === 'string') {
    return hasMinRole(r, normalizeRole(legacy));
  }

  return true;
}
