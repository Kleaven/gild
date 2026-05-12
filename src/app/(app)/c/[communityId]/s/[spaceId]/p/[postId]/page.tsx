import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContext } from '@/lib/community/context';
import { getPost } from '@/lib/feed';
import { getComments } from '@/lib/comments';
import { Avatar, GILD_FONTS } from '@/components/gild';
import PostActions from './PostActions';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

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

  const [post, commentsResult, communityContext] = await Promise.all([
    getPost(supabase, postId),
    getComments(supabase, postId, { limit: 50 }),
    getCommunityContext(communityId),
  ]);

  if (!post) {
    notFound();
  }

  const { membership } = communityContext;
  
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthor = user?.id === post.author_id;
  const isMod = membership?.role === 'owner' || membership?.role === 'admin' || membership?.role === 'moderator';
  const canDelete = isAuthor || isMod;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px', fontFamily: GILD_FONTS.sans }}>
      {/* Breadcrumb could go here */}
      <Link 
        href={`/c/${communityId}/s/${spaceId}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 13,
          color: 'oklch(0.55 0.02 250)',
          textDecoration: 'none',
          fontFamily: GILD_FONTS.mono,
          marginBottom: 20,
        }}
      >
        ← Back to feed
      </Link>

      {/* Post */}
      <article
        style={{
          border: '1px solid oklch(0.94 0.005 250)',
          borderRadius: 16,
          padding: '28px 32px',
          marginBottom: 32,
          background: '#fff',
          boxShadow: '0 4px 20px oklch(0 0 0 / 0.03)',
        }}
      >
        {post.title && (
          <h1 style={{ fontFamily: GILD_FONTS.display, fontSize: 26, fontWeight: 800, margin: '0 0 16px', letterSpacing: '-0.02em', color: '#111' }}>{post.title}</h1>
        )}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar 
            person={{
              id: post.author_id,
              name: post.author?.display_name ?? 'Unknown',
              avatar_url: post.author?.avatar_url ?? undefined,
            }}
            size={36}
          />
          <div style={{ lineHeight: 1.2 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#111' }}>
              {post.author?.display_name ?? 'Unknown'}
            </span>
            <span style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)' }}>
              {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: 'oklch(0.20 0.02 250)', margin: '0 0 28px', whiteSpace: 'pre-wrap' }}>
          {post.body}
        </p>
        <PostActions
          postId={postId}
          communityId={communityId}
          spaceId={spaceId}
          likeCount={post.like_count}
          viewerHasVoted={post.viewer_has_voted}
          canDelete={canDelete}
        />
      </article>

      {/* Comments */}
      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
          {commentsResult.data.length} comment{commentsResult.data.length !== 1 ? 's' : ''}
        </h2>
        <CommentForm postId={postId} />
        <CommentList initialComments={commentsResult.data} postId={postId} />
      </section>
    </div>
  );
}
