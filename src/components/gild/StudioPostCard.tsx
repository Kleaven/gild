'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, Reactions, GILD_FONTS } from '@/components/gild';
import type { Person } from '@/components/gild';

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
  };
  communityId: string;
  spaceId: string;
  hue?: number;
  canPin?: boolean;
  onDelete?: (postId: string) => void;
  onPin?: (postId: string, pin: boolean) => void;
}

export function StudioPostCard({
  post,
  communityId,
  spaceId,
  hue = 220,
  canPin = false,
  onDelete,
  onPin,
}: StudioPostCardProps) {
  const authorPerson: Person = {
    id: 'author',
    name: post.author?.display_name || 'Member',
    role: 'free_member',
    hue: (post.author?.display_name?.charCodeAt(0) || 0) * 10 % 360,
    online: false,
  };

  const isOptimistic = Boolean((post as { _optimistic?: boolean })._optimistic);

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Avatar person={authorPerson} size={26} />
        <div style={{ lineHeight: 1.2 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{authorPerson.name}</p>
          <p style={{ fontSize: 11, color: 'oklch(0.50 0.02 250)', margin: 0 }}>
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Link
        href={`/c/${communityId}/s/${spaceId}/p/${post.id}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
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
          {post.body.length > 300 ? post.body.slice(0, 300) + '…' : post.body}
        </p>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Reactions items={[['❤️', post.like_count]]} hue={hue} />
          <Link
            href={`/c/${communityId}/s/${spaceId}/p/${post.id}`}
            style={{
              fontSize: 12,
              color: 'oklch(0.50 0.02 250)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            {post.comment_count} comments
          </Link>
        </div>

        {/* Action buttons — hidden for optimistic items */}
        {!isOptimistic && (onDelete || (canPin && onPin)) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {canPin && onPin && (
              <button
                onClick={() => onPin(post.id, !post.is_pinned)}
                title={post.is_pinned ? 'Unpin post' : 'Pin post'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: post.is_pinned ? 'oklch(0.40 0.10 250)' : 'oklch(0.55 0.02 250)',
                  fontWeight: post.is_pinned ? 700 : 400,
                  padding: '4px 6px',
                  borderRadius: 6,
                  transition: 'color 0.15s ease',
                }}
              >
                {post.is_pinned ? '📌 Pinned' : '📌 Pin'}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Delete this post?')) onDelete(post.id);
                }}
                title="Delete post"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#c00',
                  padding: '4px 6px',
                  borderRadius: 6,
                  transition: 'opacity 0.15s ease',
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
