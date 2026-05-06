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
    author?: {
      display_name: string | null;
      avatar_url: string | null;
    };
  };
  communityId: string;
  spaceId: string;
  hue?: number;
}

export function StudioPostCard({ post, communityId, spaceId, hue = 220 }: StudioPostCardProps) {
  const authorPerson: Person = {
    id: 'author',
    name: post.author?.display_name || 'Member',
    role: 'free_member',
    hue: (post.author?.display_name?.charCodeAt(0) || 0) * 10 % 360,
    online: false,
  };

  return (
    <div style={{
      border: '1px solid oklch(0.94 0.005 250)',
      borderRadius: 12,
      background: '#fff',
      padding: '16px 18px',
      fontFamily: GILD_FONTS.sans,
      transition: 'border-color 0.2s ease',
    }}>
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
          <h3 style={{ 
            fontFamily: GILD_FONTS.display, 
            fontSize: 18, 
            fontWeight: 700, 
            margin: '0 0 6px',
            letterSpacing: '-0.01em',
          }}>{post.title}</h3>
        )}
        <p style={{ 
          fontSize: 14, 
          color: 'oklch(0.30 0.02 250)', 
          margin: '0 0 14px', 
          lineHeight: 1.55,
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}>
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
      </div>
    </div>
  );
}
