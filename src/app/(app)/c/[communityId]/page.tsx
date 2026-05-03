import { notFound, redirect } from 'next/navigation';
import { getCommunityContext } from '../../../../lib/community/context';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function CommunityHomePage({ params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const { community, spaces } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  const firstSpace = spaces.find((s) => s.deleted_at === null);

  if (firstSpace) {
    redirect(`/c/${communityId}/s/${firstSpace.id}`);
  }

  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>{community.name}</h2>
      <p>No spaces yet. Create one to get started.</p>
    </div>
  );
}
