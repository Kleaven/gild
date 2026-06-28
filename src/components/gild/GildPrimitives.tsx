'use client';

import React from 'react';
import type { Person, Space } from './types';
import { GILD_FONTS } from './styles';

// Avatar — a soft gradient disc using the person's hue, with optional presence dot.
export function Avatar({ 
  person, 
  size = 32, 
  presence = false, 
  ring = null 
}: { 
  person: Person | null; 
  size?: number; 
  presence?: boolean; 
  ring?: string | null;
}) {
  if (!person) return null;
  const h = person.hue;
  const bg = `linear-gradient(135deg, oklch(0.78 0.12 ${h}), oklch(0.55 0.16 ${h}))`;
  const initials = person.initial || person.name.split(' ').map(n => n[0]).slice(0, 2).join('');
  
  return (
    <span style={{
      position: 'relative', 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      width: size, 
      height: size, 
      borderRadius: '50%',
      background: bg, 
      color: '#fff',
      fontSize: size * 0.4, 
      fontWeight: 600, 
      letterSpacing: '0.02em',
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
      flexShrink: 0,
      fontFamily: GILD_FONTS.sans,
      // No overflow:hidden — it clipped the presence dot sitting on the edge.
      // The <img> clips itself with its own borderRadius.
    }}>
      {person.avatar_url ? (
        <img
          src={person.avatar_url}
          alt={person.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      ) : (
        initials
      )}
      {presence && person.online && (
        <span style={{
          position: 'absolute', 
          right: -1, 
          bottom: -1,
          width: Math.max(8, size * 0.28), 
          height: Math.max(8, size * 0.28),
          borderRadius: '50%', 
          background: 'oklch(0.72 0.18 150)',
          boxShadow: '0 0 0 2px #fff, 0 0 8px oklch(0.72 0.18 150 / 0.6)',
        }}/>
      )}
    </span>
  );
}

// AvatarStack — overlapping avatars with overflow count.
export function AvatarStack({ 
  people, 
  max = 4, 
  size = 24, 
  bg = '#fff' 
}: { 
  people: Person[]; 
  max?: number; 
  size?: number; 
  bg?: string;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <span key={p.id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, zIndex: shown.length - i }}>
          <Avatar person={p} size={size} ring={bg} />
        </span>
      ))}
      {rest > 0 && (
        <span style={{
          marginLeft: -size * 0.3,
          width: size, 
          height: size, 
          borderRadius: '50%',
          background: '#f3f4f6', 
          color: '#4b5563',
          fontSize: size * 0.38, 
          fontWeight: 600,
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: `0 0 0 2px ${bg}`,
          fontFamily: GILD_FONTS.mono,
        }}>+{rest}</span>
      )}
    </span>
  );
}

// CoverArt — a tasteful synthesized cover using the space hue.
export function CoverArt({ 
  space, 
  height = 140, 
  variant = 'rays' 
}: { 
  space: Space; 
  height?: number | string; 
  variant?: 'rays' | 'grid' | 'wash';
}) {
  const h = space.hue;
  let bg;
  if (variant === 'rays') {
    bg = `
      radial-gradient(ellipse at 80% 20%, oklch(0.92 0.08 ${h}) 0%, transparent 55%),
      radial-gradient(ellipse at 10% 90%, oklch(0.85 0.14 ${h}) 0%, transparent 50%),
      linear-gradient(135deg, oklch(0.96 0.04 ${h}) 0%, oklch(0.88 0.10 ${h}) 100%)
    `;
  } else if (variant === 'grid') {
    bg = `
      repeating-linear-gradient(45deg, oklch(0.92 0.06 ${h}) 0 1px, transparent 1px 14px),
      linear-gradient(180deg, oklch(0.96 0.04 ${h}), oklch(0.86 0.12 ${h}))
    `;
  } else if (variant === 'wash') {
    bg = `linear-gradient(180deg, oklch(0.94 0.05 ${h}) 0%, oklch(0.78 0.14 ${h}) 100%)`;
  }
  
  return (
    <div style={{
      width: '100%', 
      height, 
      background: bg, 
      position: 'relative', 
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', 
        left: 0, 
        right: 0, 
        bottom: 0, 
        height: 2,
        background: 'linear-gradient(90deg, transparent, oklch(0.82 0.14 75), transparent)',
        opacity: 0.7,
      }}/>
    </div>
  );
}

// Imagery placeholder for post images.
export function PostImage({ 
  hue, 
  label = 'image', 
  height = 200, 
  variant = 'wash' 
}: { 
  hue: number; 
  label?: string; 
  height?: number | string; 
  variant?: 'wash' | 'chart';
}) {
  return (
    <div style={{
      width: '100%', 
      height, 
      background: variant === 'chart'
        ? `linear-gradient(180deg, oklch(0.96 0.04 ${hue}) 0%, oklch(0.85 0.12 ${hue}) 100%)`
        : `linear-gradient(135deg, oklch(0.90 0.10 ${hue}) 0%, oklch(0.70 0.16 ${hue}) 100%)`,
      borderRadius: 8, 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
    }}>
      {variant === 'chart' && (
        <div style={{
          position: 'absolute', 
          inset: '20% 12% 18% 12%',
          backgroundImage: `
            linear-gradient(to top, oklch(0.55 0.16 ${hue}) 2px, transparent 2px),
            linear-gradient(to top, transparent 0, transparent 0)
          `,
          backgroundSize: '100% 25%, 100% 25%',
        }}>
          <div style={{
            position: 'absolute', 
            inset: 0,
            clipPath: 'polygon(0 80%, 18% 60%, 36% 65%, 54% 40%, 72% 30%, 90% 12%, 100% 8%, 100% 100%, 0 100%)',
            background: `linear-gradient(180deg, oklch(0.55 0.18 ${hue} / 0.8), oklch(0.55 0.18 ${hue} / 0.2))`,
          }}/>
        </div>
      )}
      <span style={{
        position: 'absolute', 
        top: 8, 
        right: 10,
        fontFamily: GILD_FONTS.mono,
        fontSize: 10, 
        color: 'oklch(0.32 0.08 ' + hue + ')', 
        opacity: 0.6,
        letterSpacing: '0.08em', 
        textTransform: 'uppercase',
      }}>{label}</span>
    </div>
  );
}

// Live "online now" pill
export function LivePill({ count, hue = 150 }: { count: number | string; hue?: number }) {
  return (
    <span style={{
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: 6,
      padding: '3px 8px 3px 7px', 
      borderRadius: 999,
      background: `oklch(0.96 0.04 ${hue})`,
      color: `oklch(0.42 0.14 ${hue})`,
      fontFamily: GILD_FONTS.mono,
      fontSize: 11, 
      fontWeight: 500, 
      letterSpacing: '0.02em',
    }}>
      <span style={{
        width: 6, 
        height: 6, 
        borderRadius: '50%',
        background: `oklch(0.62 0.18 ${hue})`,
        boxShadow: `0 0 0 3px oklch(0.62 0.18 ${hue} / 0.2)`,
        animation: 'gild-pulse 2s ease-in-out infinite',
      }}/>
      {count} online
    </span>
  );
}

// Wordmark — "Gild." with a signature yellow dot at the end.
export function Wordmark({ size = 28, color = '#0d0d0d' }: { size?: number; color?: string }) {
  return (
    <span style={{
      fontFamily: GILD_FONTS.display,
      fontWeight: 800, 
      fontSize: size, 
      letterSpacing: '-0.045em',
      color, 
      lineHeight: 1, 
      display: 'inline-flex', 
      alignItems: 'baseline',
      userSelect: 'none',
    }}>
      Gild
      <span style={{
        marginLeft: '0.04em',
        width: '0.24em',
        height: '0.24em',
        borderRadius: '50%',
        background: 'oklch(0.85 0.18 90)', // Vibrant yellow
        boxShadow: '0 0 8px oklch(0.85 0.18 90 / 0.4)',
        display: 'inline-block',
      }}/>
    </span>
  );
}

// Reaction row
export function Reactions({
  items,
  hue = 220,
  showAddButton = false,
}: {
  items?: [string, number][];
  hue?: number;
  showAddButton?: boolean;
}) {
  if (!items) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {items.map(([emoji, n], i) => (
        <span key={i} style={{
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 4,
          padding: '3px 8px', 
          borderRadius: 999,
          background: `oklch(0.97 0.02 ${hue})`,
          border: `1px solid oklch(0.92 0.04 ${hue})`,
          fontSize: 12, 
          color: `oklch(0.32 0.08 ${hue})`,
          fontFamily: GILD_FONTS.sans, 
          fontWeight: 500,
        }}>
          <span style={{ fontSize: 13 }}>{emoji}</span>
          <span style={{ fontFamily: GILD_FONTS.mono, fontSize: 11 }}>{n}</span>
        </span>
      ))}
      {showAddButton && (
        <button style={{
          padding: '3px 8px',
          borderRadius: 999,
          background: 'transparent',
          border: '1px dashed #d4d4d8',
          color: '#71717a',
          fontSize: 12,
          cursor: 'pointer',
        }}>+</button>
      )}
    </div>
  );
}
