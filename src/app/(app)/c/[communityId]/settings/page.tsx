import { notFound } from 'next/navigation';
import { getCommunityContext } from '@/lib/community/context';
import CommunitySettings from './CommunitySettings';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string }>;
};

export default async function CommunitySettingsPage({ params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const { community, membership } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    notFound();
  }

  return <CommunitySettings community={community} />;
}
