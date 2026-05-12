'use client';

import { useRouter } from 'next/navigation';
import { CreateCommunityForm } from '@/components/gild/CreateCommunityForm';

export default function CommunityForm() {
  const router = useRouter();

  return (
    <CreateCommunityForm 
      onSuccess={(communityId) => router.push(`/c/${communityId}/dashboard`)}
    />
  );
}
