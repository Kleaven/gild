'use client';

import { useRouter } from 'next/navigation';
import { CreateCommunityForm } from '@/components/gild/CreateCommunityForm';

export default function NewCommunityPage() {
  const router = useRouter();

  return (
    <div style={{ maxWidth: 520, margin: '60px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>Create a community</h1>
      <CreateCommunityForm
        submitLabel="Create community"
        onSuccess={(_communityId, slug) => router.push(`/c/${slug}/settings`)}
      />
    </div>
  );
}
