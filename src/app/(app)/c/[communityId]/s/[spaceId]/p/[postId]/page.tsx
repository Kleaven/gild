import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getPost } from '@/lib/feed';
import { getComments } from '@/lib/comments';
import PostActions from './PostActions';
import CommentList from './CommentList';
import { Avatar, GILD_FONTS } from '@/components/gild';
import type { Person } from '@/components/gild';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ communityId: string; spaceId: string; postId: string }>;
};

export default async function PostPage({ params }: Props) {
  const { communityId, spaceId, postId } = await params;

  if (!UUID_RE.test(postId)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();

  const [post, commentsResult] = await Promise.all([
    getPost(supabase, postId),
    getComments(supabase, postId, { limit: 50 }),
  ]);

  if (!post) {
    notFound();
  }

  const authorPerson: Person = {
    id: post.author_id ?? 'unknown',
    name: post.author?.display_name || 'Member',
    role: 'free_member',
    hue: (post.author?.display_name?.charCodeAt(0) || 0) * 10 % 360,
    online: false,
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 28px', fontFamily: GILD_FONTS.sans }}>
      {/* Post */}
      <article style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Avatar person={authorPerson} size={32} />
          <div style={{ lineHeight: 1.2 }}>
            <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{authorPerson.name}</p>
            <p style={{ fontSize: 12, color: 'oklch(0.50 0.02 250)', margin: 0 }}>
              {new Date(post.created_at).toLocaleDateString()} · In {post.space?.name || 'General'}
            </p>
          </div>
        </div>

        {post.title && (
          <h1 style={{ 
            fontFamily: GILD_FONTS.display,
            fontSize: 32, 
            fontWeight: 800, 
            margin: '0 0 16px',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>{post.title}</h1>
        )}
        
        <div style={{ 
          fontSize: 16, 
          lineHeight: 1.6, 
          color: 'oklch(0.20 0.02 250)', 
          margin: '0 0 24px', 
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {post.body}
        </div>

        <div style={{ padding: '16px 0', borderTop: '1px solid oklch(0.95 0.005 250)', borderBottom: '1px solid oklch(0.95 0.005 250)' }}>
          <PostActions
            postId={postId}
            communityId={communityId}
            spaceId={spaceId}
            likeCount={post.like_count}
            viewerHasVoted={post.viewer_has_voted}
          />
        </div>
      </article>

      {/* Comments */}
      <section>
        <h2 style={{ 
          fontFamily: GILD_FONTS.display,
          fontSize: 18, 
          fontWeight: 700, 
          marginBottom: 20,
          letterSpacing: '-0.015em',
        }}>
          {commentsResult.data.length} comment{commentsResult.data.length !== 1 ? 's' : ''}
        </h2>
        <CommentList initialComments={commentsResult.data} postId={postId} />
      </section>
    </div>
  );
}
