// server-only — do not import from client components
import { redirect } from 'next/navigation';
import { assertMinRole, getCommunityVisibility, getUserCommunityRole } from './community';
import { isPlatformAdmin } from './platform';
import type { MemberRole } from './roles';

export async function requireCommunityRole(
  userId: string,
  communityId: string,
  minRole: MemberRole,
): Promise<{ role: MemberRole }> {
  const result = await assertMinRole(userId, communityId, minRole);
  if (result.error) {
    redirect('/');
  }
  return { role: result.data.role };
}

export async function requirePlatformAdmin(userId: string): Promise<void> {
  const admin = await isPlatformAdmin(userId);
  if (!admin) {
    redirect('/');
  }
}

export async function canViewCommunity(
  userId: string | null,
  communityId: string,
): Promise<boolean> {
  const visibility = await getCommunityVisibility(communityId);

  if (visibility === null) return false;
  if (visibility === 'public') return true;

  // Private community: unauthenticated visitors cannot view.
  if (userId === null) return false;

  const role = await getUserCommunityRole(userId, communityId);

  // Must be a member and not banned.
  return role !== null && role !== 'banned';
}
