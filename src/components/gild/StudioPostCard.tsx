'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, PollRenderer } from './index';
import ReactionPicker from './ReactionPicker';
import type { ReactionTally } from '@/lib/reactions';
import { GILD_FONTS } from './styles';
import { ConfirmModal } from './ConfirmModal';
import type { Person } from './types';
import { Pin, Trash2, ArrowBigUp } from 'lucide-react';
import { toggleVote } from '@/app/actions/comments';

interface StudioPostCardProps {
  post: {
    id: string;
    title: string | null;
    body: string;
    created_at: string;
    like_count: number;
    comment_count: number;
    is_pinned?: boolean;
    author?: {
      display_name: string | null;
      avatar_url: string | null;
    };
    /** Set on optimistic items before server confirms. */
    _optimistic?: boolean;
    media_urls?: string[] | null;
    type?: string;
    poll_options?: { id: string; text: string }[] | null;
    poll_results?: Record<string, number> | null;
    viewer_voted_option?: string | null;
    viewer_has_voted?: boolean;
    reactions?: ReactionTally[];
  };
  communitySlug: string;
  spaceId: string;
  hue?: number;
  canPin?: boolean;
  reactionsEnabled?: boolean;
  onDelete?: (postId: string) => void;
  onPin?: (postId: string, pin: boolean) => void;
  onVote?: (postId: string, optionId: string) => void;
}

const iconBtn: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 6,
  border: '1px solid oklch(0.94 0.005 250)',
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: 'oklch(0.40 0.02 250)',
  transition: 'all 0.15s ease',
};

export function StudioPostCard({
  post,
  communitySlug,
  spaceId,
  hue = 220,
  canPin = false,
  reactionsEnabled = false,
  onDelete,
  onPin,
  onVote,
}: StudioPostCardProps) {
  const [showConfirm, setShowConfirm] = React.useState(false);
  // Upvote with optimistic local state — the same control here and on the
  // post page, so liking never requires opening the comments first.
  const [voted, setVoted] = React.useState(post.viewer_has_voted ?? false);
  const [likes, setLikes] = React.useState(post.like_count);

  function handleUpvote() {
    if (isOptimistic) return;
    const next = !voted;
    setVoted(next);
    setLikes((c) => (next ? c + 1 : Math.max(0, c - 1)));
    toggleVote(post.id, 'post').catch(() => {
      setVoted(!next);
      setLikes((c) => (next ? Math.max(0, c - 1) : c + 1));
    });
  }
  const authorPerson: Person = {
    id: 'author',
    name: post.author?.display_name || 'Member',
    role: 'free_member',
    hue: (post.author?.display_name?.charCodeAt(0) || 0) * 10 % 360,
    online: false,
  };

  const isOptimistic = Boolean(post._optimistic);
  const postHref = `/c/${communitySlug}/s/${spaceId}/p/${post.id}`;

  // YouTube embed logic
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const ytMatch = post.body.match(youtubeRegex);
  const ytId = ytMatch ? ytMatch[1] : null;
  // When a link embeds, strip the raw URL from the text — readers get the
  // video, not the messy string above it.
  const displayBody = ytMatch
    ? post.body.replace(ytMatch[0], '').replace(/\n{3,}/g, '\n\n').trim()
    : post.body;

  return (
    <div
      style={{
        border: '1px solid oklch(0.94 0.005 250)',
        borderRadius: 12,
        background: '#fff',
        padding: '16px 18px',
        fontFamily: GILD_FONTS.sans,
        transition: 'border-color 0.2s ease, opacity 0.2s ease',
        opacity: isOptimistic ? 0.6 : 1,
        position: 'relative',
      }}
    >
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => onDelete?.(post.id)}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
      />
      {/* Pinned badge — pinning must be visible, not just sort order */}
      {post.is_pinned && !isOptimistic && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            marginBottom: 10,
            padding: '3px 9px',
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 700,
            background: `oklch(0.96 0.04 ${hue})`,
            color: `oklch(0.42 0.14 ${hue})`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          <Pin size={10} /> Pinned
        </span>
      )}

      {/* Optimistic sending badge */}
      {isOptimistic && (
        <span
          style={{
            position: 'absolute',
            top: 12,
            right: 14,
            fontSize: 10,
            color: 'oklch(0.50 0.02 250)',
            fontStyle: 'italic',
          }}
        >
          Sending…
        </span>
      )}

      {/* Floating Action Menu from Lovable */}
      {!isOptimistic && (onDelete || (canPin && onPin)) && (
        <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 4, opacity: 0.6 }}>
          {canPin && onPin && (
            <button
              onClick={() => onPin(post.id, !post.is_pinned)}
              title={post.is_pinned ? 'Unpin post' : 'Pin post'}
              style={{
                ...iconBtn,
                background: post.is_pinned ? `oklch(0.96 0.04 ${hue})` : '#fff',
                color: post.is_pinned ? `oklch(0.45 0.16 ${hue})` : 'oklch(0.40 0.02 250)',
                borderColor: post.is_pinned ? `oklch(0.90 0.06 ${hue})` : 'oklch(0.94 0.005 250)',
              }}
            >
              <Pin size={13} fill={post.is_pinned ? 'currentColor' : 'none'} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => setShowConfirm(true)}
              title="Delete post"
              style={{
                ...iconBtn,
                color: '#c00',
                borderColor: 'oklch(0.94 0.005 250)',
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingRight: 60 }}>
        <Avatar person={authorPerson} size={26} />
        <div style={{ lineHeight: 1.2 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{authorPerson.name}</p>
          <p 
            style={{ fontSize: 11, color: 'oklch(0.50 0.02 250)', margin: 0 }}
          >
            {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/*
        Optimistic items use a div instead of Link — the temp UUID id
        would produce a 404 if navigated to before the server confirms.
      */}
      {isOptimistic ? (
        <div style={{ color: 'inherit', display: 'block' }}>
          {post.title && (
            <h3
              style={{
                fontFamily: GILD_FONTS.display,
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 6px',
                letterSpacing: '-0.01em',
              }}
            >
              {post.title}
            </h3>
          )}
          <p
            style={{
              fontSize: 14,
              color: 'oklch(0.30 0.02 250)',
              margin: '0 0 14px',
              lineHeight: 1.55,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {displayBody.length > 500 ? displayBody.slice(0, 500) + '…' : displayBody}
          </p>
          {ytId && (
            <div style={{ marginBottom: 14, borderRadius: 12, overflow: 'hidden', position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {post.media_urls && post.media_urls.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: post.media_urls.length > 1 ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 14 }}>
              {post.media_urls.map((url, i) => (
                <img key={i} src={url} style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 400 }} alt="Post attachment" />
              ))}
            </div>
          )}
          {post.type === 'poll' && post.poll_options && (
            <PollRenderer 
              postId={post.id} 
              options={post.poll_options} 
              results={post.poll_results || null} 
              viewerVotedOption={post.viewer_voted_option || null}
              hue={hue}
              onVote={(optId) => onVote?.(post.id, optId)}
            />
          )}
        </div>
      ) : (
        <Link href={postHref} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          {post.title && (
            <h3
              style={{
                fontFamily: GILD_FONTS.display,
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 6px',
                letterSpacing: '-0.01em',
              }}
            >
              {post.title}
            </h3>
          )}
          <p
            style={{
              fontSize: 14,
              color: 'oklch(0.30 0.02 250)',
              margin: '0 0 14px',
              lineHeight: 1.55,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {displayBody.length > 500 ? displayBody.slice(0, 500) + '…' : displayBody}
          </p>
          {ytId && (
            <div style={{ marginBottom: 14, borderRadius: 12, overflow: 'hidden', position: 'relative', width: '100%', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {post.media_urls && post.media_urls.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: post.media_urls.length > 1 ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 14 }}>
              {post.media_urls.map((url, i) => (
                <img key={i} src={url} style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 400 }} alt="Post attachment" />
              ))}
            </div>
          )}
          {post.type === 'poll' && post.poll_options && (
            <div onClick={(e) => e.preventDefault()}>
              <PollRenderer 
                postId={post.id} 
                options={post.poll_options} 
                results={post.poll_results || null} 
                viewerVotedOption={post.viewer_voted_option || null}
                hue={hue}
                onVote={(optId) => onVote?.(post.id, optId)}
              />
            </div>
          )}
        </Link>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {reactionsEnabled ? (
            <ReactionPicker
              targetId={post.id}
              targetType="post"
              initialReactions={post.reactions ?? []}
              enabled={!isOptimistic}
              hue={hue}
            />
          ) : (
            <button
              onClick={handleUpvote}
              disabled={isOptimistic}
              aria-pressed={voted}
              title={voted ? 'Remove upvote' : 'Upvote'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 999,
                border: voted ? `1px solid oklch(0.70 0.12 ${hue})` : '1px solid oklch(0.92 0.01 250)',
                background: voted ? `oklch(0.96 0.04 ${hue})` : '#fff',
                color: voted ? `oklch(0.40 0.14 ${hue})` : 'oklch(0.42 0.02 250)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: isOptimistic ? 'default' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
            >
              <ArrowBigUp size={15} strokeWidth={2.5} fill={voted ? 'currentColor' : 'none'} />
              {likes}
            </button>
          )}
          {isOptimistic ? (
            <span
              style={{
                fontSize: 12,
                color: 'oklch(0.50 0.02 250)',
                fontWeight: 500,
              }}
            >
              0 comments
            </span>
          ) : (
            <Link
              href={postHref}
              style={{
                fontSize: 12,
                color: 'oklch(0.50 0.02 250)',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              {post.comment_count} comments
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
