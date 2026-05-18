'use client';

import { useGlobalNotifications } from '@/hooks';

export function NotificationListener({
  communityId,
  communitySlug,
}: {
  communityId: string;
  communitySlug: string;
}) {
  useGlobalNotifications(communityId, communitySlug);
  return null;
}
