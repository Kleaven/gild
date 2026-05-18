import { notFound, redirect } from 'next/navigation';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { GILD_FONTS, CoverArt } from '@/components/gild';
import JoinButton from './JoinButton';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function JoinPage({ params }: Props) {
  const { slug } = await params;

  const { community, membership } = await getCommunityContextBySlug(slug);

  if (!community) {
    notFound();
  }

  // Already a member — send them in
  if (membership) {
    redirect(`/c/${slug}`);
  }

  const communityId = community.id;
  const hue = (communityId.charCodeAt(0) * 11) % 360;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'oklch(0.99 0.002 250)', fontFamily: GILD_FONTS.sans }}>
      <div style={{ margin: 'auto', width: '100%', maxWidth: 440, padding: 24 }}>
        <div style={{
          background: '#fff',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 12px 48px oklch(0 0 0 / 0.08)',
          border: '1px solid oklch(0.94 0.005 250)',
        }}>
          <CoverArt
            space={{ id: community.id, name: community.name, desc: community.description ?? '', hue }}
            height={160}
            variant="rays"
          />
          <div style={{ padding: '32px 32px 40px', textAlign: 'center' }}>
            <h1 style={{ fontFamily: GILD_FONTS.display, fontSize: 32, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.03em', color: '#111' }}>
              {community.name}
            </h1>
            {community.description && (
              <p style={{ fontSize: 16, color: 'oklch(0.40 0.02 250)', margin: '0 0 20px', lineHeight: 1.5 }}>
                {community.description}
              </p>
            )}
            <p style={{ fontSize: 14, color: 'oklch(0.55 0.02 250)', margin: '0 0 32px', fontWeight: 500, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {community.member_count} member{community.member_count !== 1 ? 's' : ''}
            </p>
            <JoinButton communityId={communityId} communitySlug={slug} />
          </div>
        </div>
      </div>
    </div>
  );
}
