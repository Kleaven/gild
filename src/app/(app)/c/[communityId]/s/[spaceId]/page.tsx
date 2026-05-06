import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getSpace } from '@/lib/community';
import { getFeedPosts } from '@/lib/feed';
import PostForm from './PostForm';
import PostList from './PostList';
import { StudioRightRail, GILD_FONTS, Person } from '@/components/gild';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string; spaceId: string }>;
};

export default async function SpacePage({ params }: Props) {
  const { communityId, spaceId } = await params;

  if (!UUID_RE.test(spaceId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();

  const [space, postsResult] = await Promise.all([
    getSpace(supabase, spaceId),
    getFeedPosts(supabase, communityId, spaceId, { limit: 20 }),
  ]);

  if (!space) {
    notFound();
  }

  // Mock online people for right rail
  const mockOnline: Person[] = [
    { id: 'mira', name: 'Mira Patel', hue: 320, online: true },
    { id: 'sam', name: 'Sam Okafor', hue: 150, online: true },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', minHeight: '100%' }}>
      <div style={{ padding: '24px 28px', maxWidth: 720, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span style={{ 
            width: 10, 
            height: 10, 
            borderRadius: 3, 
            background: `oklch(0.62 0.16 ${space.hue || 220})`,
            boxShadow: `0 0 0 4px oklch(0.62 0.16 ${space.hue || 220} / 0.1)` 
          }}/>
          <h1 style={{ 
            fontFamily: GILD_FONTS.display,
            fontSize: 24, 
            fontWeight: 700, 
            margin: 0,
            letterSpacing: '-0.02em',
          }}>{space.name}</h1>
        </div>

        <PostForm communityId={communityId} spaceId={spaceId} />

        <PostList
          initialPosts={postsResult.data}
          communityId={communityId}
          spaceId={spaceId}
          hue={space.hue}
        />
      </div>
      
      <StudioRightRail 
        onlinePeople={mockOnline} 
        stats={{
          posts: postsResult.data.length.toString(),
          replies: '0',
          members: '—',
          reactions: postsResult.data.reduce((acc, p) => acc + p.like_count, 0).toString(),
        }}
      />
    </div>
  );
}
