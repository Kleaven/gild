import { notFound, redirect } from 'next/navigation';
import { getCommunityContextBySlug } from '../../../../lib/community/context';

const SLUG_RE = /^[a-z0-9-]{3,50}$/;

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CommunityHomePage({ params }: Props) {
  const { slug } = await params;

  if (!SLUG_RE.test(slug)) {
    notFound();
  }

  const { community, spaces } = await getCommunityContextBySlug(slug);

  if (!community) {
    notFound();
  }

  const firstSpace = spaces.find((s) => s.deleted_at === null);

  if (firstSpace) {
    redirect(`/c/${slug}/s/${firstSpace.id}`);
  }

  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>{community.name}</h2>
      <p>No spaces yet. Create one to get started.</p>
    </div>
  );
}
