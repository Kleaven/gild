import { notFound } from 'next/navigation';
import { getCommunityContextBySlug } from '@/lib/community/context';
import CommunitySettings from './CommunitySettings';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CommunitySettingsPage({ params }: Props) {
  const { slug } = await params;

  const { community, membership } = await getCommunityContextBySlug(slug);

  if (!community) {
    notFound();
  }

  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    notFound();
  }

  return <CommunitySettings community={community} />;
}
