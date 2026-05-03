import { notFound, redirect } from 'next/navigation';
import { getCommunityContext } from '@/lib/community/context';
import JoinButton from './JoinButton';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function JoinPage({ params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const { community, membership } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  // Already a member — send them in
  if (membership) {
    redirect(`/c/${communityId}`);
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '80px auto',
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>{community.name}</h1>
      {community.description && (
        <p style={{ fontSize: 15, color: '#666', marginBottom: 16 }}>{community.description}</p>
      )}
      <p style={{ fontSize: 14, color: '#aaa', marginBottom: 32 }}>
        {community.member_count} member{community.member_count !== 1 ? 's' : ''}
      </p>
      <JoinButton communityId={communityId} />
    </div>
  );
}
