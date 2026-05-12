'use client';

import { useGlobalNotifications } from '@/hooks';

export function NotificationListener({ communityId }: { communityId: string }) {
  useGlobalNotifications(communityId);
  return null;
}
