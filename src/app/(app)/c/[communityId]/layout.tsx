import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCommunityContext } from '../../../../lib/community/context';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  children: React.ReactNode;
  params: Promise<{ communityId: string }>;
};

export default async function CommunityLayout({ children, params }: Props) {
  const { communityId } = await params;

  if (!UUID_RE.test(communityId)) {
    notFound();
  }

  const { community, membership, spaces } = await getCommunityContext(communityId);

  if (!community) {
    notFound();
  }

  // Private community — non-members must join first
  if (community.is_private && !membership) {
    redirect(`/c/${communityId}/join`);
  }

  const feedSpaces = spaces.filter((s) => s.deleted_at === null);

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 49px)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          borderRight: '1px solid #eee',
          padding: '24px 0',
          flexShrink: 0,
          background: '#fafafa',
        }}
      >
        <div style={{ padding: '0 16px 16px', borderBottom: '1px solid #eee' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{community.name}</h2>
          <p style={{ fontSize: 12, color: '#888', margin: '4px 0 0' }}>
            {community.member_count} members
          </p>
        </div>
        <nav style={{ padding: '12px 8px' }}>
          {feedSpaces.map((space) => (
            <Link
              key={space.id}
              href={`/c/${communityId}/s/${space.id}`}
              style={{
                display: 'block',
                padding: '8px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#333',
                fontSize: 14,
                marginBottom: 2,
              }}
            >
              {space.name}
            </Link>
          ))}
          <div style={{ borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12 }}>
            <Link
              href={`/c/${communityId}/members`}
              style={{
                display: 'block',
                padding: '8px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#555',
                fontSize: 13,
              }}
            >
              Members
            </Link>
            <Link
              href={`/c/${communityId}/search`}
              style={{
                display: 'block',
                padding: '8px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                color: '#555',
                fontSize: 13,
              }}
            >
              Search
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
