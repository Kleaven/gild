'use client';

/**
 * Checks if a user with a specific role has a permission, given the community/space config.
 */
export function hasPermission(
  role: string | undefined,
  permission: string,
  config: Record<string, unknown> | undefined
): boolean {
  if (!role) return false;
  if (role === 'owner') return true;
  if (role === 'banned') return false;

  const rolePerms = config?.[role] as Record<string, unknown> | undefined;
  if (!rolePerms) return false;

  return !!rolePerms[permission];
}
