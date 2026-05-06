'use client';

import React from 'react';
import { Avatar, GILD_FONTS } from '@/components/gild';
import type { Person } from '@/components/gild';

interface StudioRightRailProps {
  onlinePeople: Person[];
  stats?: {
    posts: string;
    replies: string;
    members: string;
    reactions: string;
  };
}

export function StudioRightRail({ onlinePeople, stats }: StudioRightRailProps) {
  return (
    <aside style={{
      borderLeft: '1px solid oklch(0.94 0.005 250)',
      padding: '18px 18px', 
      background: 'oklch(0.99 0.002 250)',
      display: 'flex', 
      flexDirection: 'column', 
      gap: 18,
      width: 280,
      flexShrink: 0,
      fontFamily: GILD_FONTS.sans,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            width: 8, 
            height: 8, 
            borderRadius: '50%',
            background: 'oklch(0.62 0.18 150)',
            animation: 'gild-pulse 2s ease-in-out infinite',
          }}/>
          <p style={{
            fontSize: 11, 
            fontWeight: 600,
            textTransform: 'uppercase', 
            letterSpacing: '0.06em',
            color: 'oklch(0.42 0.14 150)', 
            margin: 0,
          }}>Live now · {onlinePeople.length}</p>
        </div>
        {onlinePeople.length === 0 ? (
          <p style={{ fontSize: 12, color: 'oklch(0.50 0.02 250)', margin: 0 }}>No one is online right now.</p>
        ) : (
          onlinePeople.map(p => (
            <div key={p.id} style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              padding: '5px 0',
            }}>
              <Avatar person={p} size={24} presence />
              <div style={{ lineHeight: 1.2, flex: 1, minWidth: 0 }}>
                <p style={{ 
                  fontSize: 13, 
                  fontWeight: 500, 
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis' 
                }}>{p.name}</p>
                <p style={{
                  fontSize: 10, 
                  color: 'oklch(0.50 0.02 250)', 
                  margin: 0,
                  fontFamily: GILD_FONTS.mono,
                }}>in #general</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div>
        <p style={{
          fontSize: 11, 
          fontWeight: 600,
          textTransform: 'uppercase', 
          letterSpacing: '0.06em',
          color: 'oklch(0.50 0.02 250)', 
          margin: '0 0 8px',
        }}>Pulse · 7 days</p>
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 8,
        }}>
          {[
            { label: 'Posts', val: stats?.posts || '+0', hue: 280 },
            { label: 'Replies', val: stats?.replies || '+0', hue: 220 },
            { label: 'Members', val: stats?.members || '+0', hue: 150 },
            { label: 'Reactions', val: stats?.reactions || '+0', hue: 75 },
          ].map((item) => (
            <div key={item.label} style={{
              padding: '10px 12px', 
              borderRadius: 8,
              background: '#fff',
              border: '1px solid oklch(0.94 0.005 250)',
            }}>
              <p style={{
                fontFamily: GILD_FONTS.display,
                fontSize: 18, 
                fontWeight: 700, 
                margin: '0 0 2px',
                color: `oklch(0.42 0.14 ${item.hue})`, 
                letterSpacing: '-0.02em',
              }}>{item.val}</p>
              <p style={{
                fontSize: 10, 
                color: 'oklch(0.50 0.02 250)', 
                margin: 0,
                textTransform: 'uppercase', 
                letterSpacing: '0.04em', 
                fontWeight: 600,
              }}>{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
