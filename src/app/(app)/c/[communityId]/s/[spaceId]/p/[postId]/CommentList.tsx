'use client';

import React, { useState, useTransition, useOptimistic } from 'react';
import { useRouter } from 'next/navigation';
import type { CommentNode } from '@/lib/comments';
import { deleteComment, updateComment } from '@/lib/comments/actions';
import { useRealtimeComments } from '@/hooks';
import { Avatar, GILD_FONTS } from '@/components/gild';
import { Trash2, Edit2, X, Check } from 'lucide-react';

type Props = {
  initialComments: CommentNode[];
  postId: string;
  currentUserId?: string;
  isMod?: boolean;
};

type OptimisticAction = 
  | { type: 'edit'; id: string; body: string }
  | { type: 'delete'; id: string };

export default function CommentList({ initialComments, postId, currentUserId, isMod }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [isPending, startTransition] = useTransition();

  const [optimisticComments, addOptimisticAction] = useOptimistic(
    initialComments,
    (state: CommentNode[], action: OptimisticAction) => {
      if (action.type === 'edit') {
        return state.map(c => c.id === action.id ? { ...c, body: action.body } : c);
      }
      if (action.type === 'delete') {
        return state.filter(c => c.id !== action.id);
      }
      return state;
    }
  );

  useRealtimeComments(postId, () => {
    router.refresh();
  });

  const handleDelete = (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    startTransition(async () => {
      addOptimisticAction({ type: 'delete', id: commentId });
      try {
        await deleteComment(commentId);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete');
        // router.refresh() will revert the optimistic change if it failed on server
        router.refresh();
      }
    });
  };

  const handleUpdate = (commentId: string) => {
    const newBody = editBody;
    setEditingId(null);
    
    startTransition(async () => {
      addOptimisticAction({ type: 'edit', id: commentId, body: newBody });
      try {
        await updateComment(commentId, newBody);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to update');
        router.refresh();
      }
    });
  };

  if (optimisticComments.length === 0) {
    return <p style={{ color: 'oklch(0.55 0.02 250)', fontSize: 14, fontFamily: GILD_FONTS.sans }}>No comments yet.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: GILD_FONTS.sans }}>
      {optimisticComments.map((comment) => {
        const isAuthor = currentUserId === comment.author_id;
        const createdAt = new Date(comment.created_at);
        const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
        const withinTimeWindow = hoursSinceCreation <= 5;
        const canEdit = (isAuthor && withinTimeWindow) || isMod;
        const canDelete = (isAuthor && withinTimeWindow) || isMod;
        const isEditing = editingId === comment.id;

        return (
          <li
            key={comment.id}
            style={{
              border: '1px solid oklch(0.94 0.005 250)',
              borderRadius: 12,
              padding: '16px 20px',
              background: '#fff',
              boxShadow: '0 2px 8px oklch(0 0 0 / 0.02)',
              position: 'relative',
              opacity: isPending ? 0.7 : 1,
              transition: 'opacity 0.2s ease',
            }}
          >
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                    {createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {createdAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {!isEditing && (canEdit || canDelete) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {canEdit && (
                    <button 
                      onClick={() => { setEditingId(comment.id); setEditBody(comment.body); }}
                      style={iconBtnStyle}
                      title="Edit comment"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      style={{ ...iconBtnStyle, color: 'oklch(0.45 0.15 25)' }}
                      title="Delete comment"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  style={editInputStyle}
                  rows={3}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={() => setEditingId(null)} style={cancelBtnStyle}>
                    <X size={14} /> Cancel
                  </button>
                  <button 
                    onClick={() => handleUpdate(comment.id)} 
                    disabled={isPending || !editBody.trim()}
                    style={saveBtnStyle}
                  >
                    <Check size={14} /> {isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'oklch(0.20 0.02 250)', whiteSpace: 'pre-wrap' }}>
                {comment.body}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 4,
  cursor: 'pointer',
  color: 'oklch(0.55 0.02 250)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  transition: 'all 0.2s ease',
};

const editInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 8,
  border: '1.5px solid oklch(0.20 0.02 250)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  resize: 'none',
  boxSizing: 'border-box',
};

const cancelBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 6,
  background: 'none',
  border: 'none',
  fontSize: 12,
  fontWeight: 600,
  color: '#666',
  cursor: 'pointer',
};

const saveBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 6,
  background: '#111',
  color: '#fff',
  border: 'none',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 4,
  cursor: 'pointer',
  color: 'oklch(0.55 0.02 250)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  transition: 'all 0.2s ease',
};

const editInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 8,
  border: '1.5px solid oklch(0.20 0.02 250)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  resize: 'none',
  boxSizing: 'border-box',
};

const cancelBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 6,
  background: 'none',
  border: 'none',
  fontSize: 12,
  fontWeight: 600,
  color: '#666',
  cursor: 'pointer',
};

const saveBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 6,
  background: '#111',
  color: '#fff',
  border: 'none',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
};
