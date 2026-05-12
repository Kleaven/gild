'use client';

import { useRouter } from 'next/navigation';
import type { CommentNode } from '@/lib/comments';
import { useRealtimeComments } from '@/hooks';
import { Avatar, GILD_FONTS } from '@/components/gild';

type Props = {
  initialComments: CommentNode[];
  postId: string;
};

// CommentList renders comments and subscribes to new ones via Realtime.
// On INSERT event: router.refresh() re-fetches the Server Component so
// initialComments contains full CommentNode (with author, vote counts etc).
// No partial payload merging — the realtime payload lacks joined fields.

export default function CommentList({ initialComments, postId }: Props) {
  const router = useRouter();

  useRealtimeComments(postId, () => {
    router.refresh();
  });

  if (initialComments.length === 0) {
    return <p style={{ color: 'oklch(0.55 0.02 250)', fontSize: 14, fontFamily: GILD_FONTS.sans }}>No comments yet.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: GILD_FONTS.sans }}>
      {initialComments.map((comment) => (
        <li
          key={comment.id}
          style={{
            border: '1px solid oklch(0.94 0.005 250)',
            borderRadius: 12,
            padding: '16px 20px',
            background: '#fff',
            boxShadow: '0 2px 8px oklch(0 0 0 / 0.02)',
          }}
        >
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar 
              person={{
                id: comment.author_id,
                name: comment.author?.display_name ?? 'Unknown',
                avatar_url: comment.author?.avatar_url ?? undefined,
              }}
              size={28}
            />
            <div style={{ lineHeight: 1.2 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111' }}>
                {comment.author?.display_name ?? 'Unknown'}
              </span>
              <span style={{ fontSize: 11, color: 'oklch(0.55 0.02 250)' }}>
                {new Date(comment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'oklch(0.20 0.02 250)', whiteSpace: 'pre-wrap' }}>
            {comment.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
