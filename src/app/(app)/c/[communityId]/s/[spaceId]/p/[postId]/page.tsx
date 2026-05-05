import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getPost } from '@/lib/feed';
import { getComments } from '@/lib/comments';
import PostActions from './PostActions';
import CommentList from './CommentList';

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

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
      {/* Post */}
      <article
        style={{
          border: '1px solid #eee',
          borderRadius: 10,
          padding: '24px 28px',
          marginBottom: 32,
          background: '#fff',
        }}
      >
        {post.title && (
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>{post.title}</h1>
        )}
        <div style={{ fontSize: 13, color: '#999', marginBottom: 16, display: 'flex', gap: 12 }}>
          <span>{post.author?.display_name ?? 'Unknown'}</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#333', margin: '0 0 20px', whiteSpace: 'pre-wrap' }}>
          {post.body}
        </p>
        <PostActions
          postId={postId}
          communityId={communityId}
          spaceId={spaceId}
          likeCount={post.like_count}
          viewerHasVoted={post.viewer_has_voted}
        />
      </article>

      {/* Comments */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          {commentsResult.data.length} comment{commentsResult.data.length !== 1 ? 's' : ''}
        </h2>
        <CommentList initialComments={commentsResult.data} postId={postId} />
      </section>
    </div>
  );
}
