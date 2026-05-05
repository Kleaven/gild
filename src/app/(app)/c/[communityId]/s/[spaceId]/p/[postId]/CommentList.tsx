'use client';

import { useRouter } from 'next/navigation';
import type { CommentNode } from '@/lib/comments';
import { useRealtimeComments } from '@/hooks';

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
    return <p style={{ color: '#aaa', fontSize: 14 }}>No comments yet.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {initialComments.map((comment) => (
        <li
          key={comment.id}
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: '14px 18px',
            background: '#fafafa',
          }}
        >
          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6, display: 'flex', gap: 10 }}>
            <span>{comment.author?.display_name ?? 'Unknown'}</span>
            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#333', whiteSpace: 'pre-wrap' }}>
            {comment.body}
          </p>
        </li>
      ))}
    </ul>
  );
}
