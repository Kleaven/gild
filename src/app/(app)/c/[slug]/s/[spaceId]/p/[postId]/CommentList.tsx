'use client';

import React, { useState, useTransition, useOptimistic, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CommentNode } from '@/lib/comments';
import { deleteComment, updateComment } from '@/lib/comments/actions';
import { useRealtimeComments } from '@/hooks';
import { Avatar, GILD_FONTS, ConfirmModal, type Person } from '@/components/gild';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Place cursor at the end of text when starting edit
  useEffect(() => {
    if (editingId && textareaRef.current) {
      const length = textareaRef.current.value.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(length, length);
    }
  }, [editingId]);

  useRealtimeComments(postId, () => {
    router.refresh();
  });

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!commentToDelete) return;
    const commentId = commentToDelete;
    setShowDeleteConfirm(false);
    setCommentToDelete(null);
    
    setActionError(null);
    startTransition(async () => {
      addOptimisticAction({ type: 'delete', id: commentId });
      try {
        await deleteComment(commentId);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message.replace('[gild] ', '') : 'Could not delete the comment.');
        router.refresh();
      }
    });
  };

  const handleUpdate = (commentId: string) => {
    const newBody = editBody;
    // Set to null immediately for instant UI response
    setEditingId(null);
    
    setActionError(null);
    startTransition(async () => {
      addOptimisticAction({ type: 'edit', id: commentId, body: newBody });
      try {
        await updateComment(commentId, newBody);
        router.refresh();
      } catch (err) {
        setActionError(err instanceof Error ? err.message.replace('[gild] ', '') : 'Could not update the comment.');
        router.refresh();
      }
    });
  };

  if (optimisticComments.length === 0) {
    return <p style={{ color: 'oklch(0.55 0.02 250)', fontSize: 14, fontFamily: GILD_FONTS.sans }}>No comments yet.</p>;
  }

  return (
    <>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />

      {actionError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'oklch(0.96 0.03 25)',
          border: '1px solid oklch(0.88 0.06 25)',
          color: 'oklch(0.40 0.16 25)',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: GILD_FONTS.sans,
        }}>
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            aria-label="Dismiss"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: GILD_FONTS.sans }}>
        {optimisticComments.map((comment) => {
          const isAuthor = currentUserId === comment.author_id;
          const createdAt = new Date(comment.created_at);
          const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
          const withinTimeWindow = hoursSinceCreation <= 5;
          const canEdit = (isAuthor && withinTimeWindow) || isMod;
          const canDelete = (isAuthor && withinTimeWindow) || isMod;
          const isEditing = editingId === comment.id;

          const authorPerson: Person = {
            id: comment.author_id ?? 'unknown',
            name: comment.author?.display_name ?? 'Unknown',
            role: 'free_member',
            hue: (comment.author?.display_name?.charCodeAt(0) || 0) * 10 % 360,
            online: false,
          };

          return (
            <li
              key={comment.id}
              className="comment-item"
              style={{
                border: '1px solid oklch(0.94 0.005 250)',
                borderRadius: 12,
                padding: '16px 20px',
                background: '#fff',
                boxShadow: '0 2px 8px oklch(0 0 0 / 0.02)',
                position: 'relative',
                opacity: isPending ? 0.8 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar person={authorPerson} size={28} />
                  <div style={{ lineHeight: 1.2 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#111' }}>
                      {authorPerson.name}
                    </span>
                    <span style={{ fontSize: 11, color: 'oklch(0.55 0.02 250)' }}>
                      {createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {createdAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {!isEditing && (canEdit || canDelete) && (
                  <div 
                    className="comment-actions"
                    style={{ 
                      display: 'flex', 
                      gap: 8,
                      opacity: 0,
                      transform: 'translateX(4px)',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
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
                        onClick={() => handleDeleteClick(comment.id)}
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
                    ref={textareaRef}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    style={editInputStyle}
                    rows={3}
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
      <style dangerouslySetInnerHTML={{ __html: `
        .comment-item:hover {
          border-color: oklch(0.85 0.02 250) !important;
          box-shadow: 0 4px 12px oklch(0 0 0 / 0.04) !important;
        }
        .comment-item:hover .comment-actions {
          opacity: 1 !important;
          transform: translateX(0) !important;
        }
      `}} />
    </>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'oklch(0.98 0.005 250)',
  border: '1px solid oklch(0.94 0.005 250)',
  padding: '6px',
  cursor: 'pointer',
  color: 'oklch(0.45 0.02 250)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
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

