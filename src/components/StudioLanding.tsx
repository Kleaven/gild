'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wordmark,
  Avatar,
  Reactions,
  GILD_FONTS,
  DoodleStar,
  DoodleSpark,
  DoodleCircle,
  DoodleScribbleLine,
  DoodleHeart,
  DoodleUnderline,
  DoodleSquiggleArrow,
  DOODLE_COLORS,
} from '@/components/gild';
import type { Person } from '@/components/gild';

export function StudioLanding() {
  const mockSpaces = [
    { id: 'announcements', name: 'Announcements', hue: 42 },
    { id: 'general', name: 'General', hue: 220 },
    { id: 'introductions', name: 'Introductions', hue: 14 },
    { id: 'building', name: 'Building', hue: 280 },
  ];

  const mockUser: Person = {
    id: 'jordan',
    name: 'Jordan Lee',
    role: 'owner',
    hue: 42,
    online: true,
    initial: 'JL'
  };

  const mockOnline: Person[] = [
    { id: 'mira', name: 'Mira Patel', hue: 280, online: true, initial: 'MP', role: 'free_member' },
    { id: 'sasha', name: 'Sasha Wu', hue: 150, online: true, initial: 'SW', role: 'free_member' },
    { id: 'reza', name: 'Reza Khan', hue: 200, online: true, initial: 'RK', role: 'free_member' },
  ];

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      background: '#fff', 
      minHeight: '100vh', 
      color: '#202020',
      position: 'relative', 
      overflow: 'hidden',
    }}>
      <header style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '14px 28px', 
        borderBottom: '1px solid oklch(0.95 0.005 250)',
      }}>
        <Wordmark size={22} />
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
          <Link href="/sign-in" style={{ color: 'oklch(0.30 0.02 250)', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/sign-up" style={{
            padding: '7px 14px', 
            borderRadius: 8,
            background: 'oklch(0.20 0.02 250)', 
            color: '#fff',
            textDecoration: 'none', 
            fontWeight: 500,
          }}>Get started</Link>
        </div>
      </header>

      {/* Decorative ambient doodles */}
      <DoodleStar style={{ top: 92, left: '8%' }} size={32} color={DOODLE_COLORS.warm} />
      <DoodleSpark style={{ top: 160, left: '14%' }} size={18} color={DOODLE_COLORS.green} />
      <DoodleCircle style={{ top: 240, left: '4%' }} size={92} color={DOODLE_COLORS.lilac} />
      <DoodleScribbleLine style={{ top: 320, left: '5%' }} w={70} color={DOODLE_COLORS.warm} />

      <DoodleHeart style={{ top: 110, right: '10%' }} size={26} color={DOODLE_COLORS.warm} />
      <DoodleStar style={{ top: 200, right: '6%' }} size={22} color={DOODLE_COLORS.green} />
      <DoodleSpark style={{ top: 270, right: '14%' }} size={20} color={DOODLE_COLORS.lilac} />

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '80px 28px 40px', textAlign: 'center', position: 'relative' }}>
        <span style={{
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: 8,
          padding: '5px 12px', 
          borderRadius: 999, 
          marginBottom: 28,
          background: 'oklch(0.97 0.005 250)', 
          border: '1px solid oklch(0.92 0.01 250)',
          fontSize: 12, 
          fontWeight: 500, 
          color: 'oklch(0.32 0.02 250)',
          position: 'relative',
        }}>
          <span style={{
            width: 6, 
            height: 6, 
            borderRadius: '50%',
            background: 'oklch(0.62 0.18 150)',
          }}/>
          New · realtime presence + reactions
          <span style={{ color: 'oklch(0.50 0.02 250)' }}>→</span>
        </span>
        
        <h1 style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 80, 
          lineHeight: 0.95, 
          fontWeight: 800,
          margin: '0 auto 22px', 
          letterSpacing: '-0.045em',
          ...({'textWrap': 'balance'} as React.CSSProperties),
          maxWidth: 920,
          position: 'relative',
        }}>
          The <span style={{ position: 'relative', display: 'inline-block' }}>
            home
            <DoodleUnderline w={170} color={DOODLE_COLORS.warm}
              style={{ left: '50%', bottom: -12, transform: 'translateX(-50%)' }} />
          </span> for paid<br/>communities.
          <DoodleStar style={{ top: -18, right: '14%' }} size={26} color={DOODLE_COLORS.warm} />
        </h1>
        
        <p style={{
          fontSize: 19, 
          lineHeight: 1.5, 
          color: 'oklch(0.42 0.02 250)',
          margin: '0 auto 32px', 
          maxWidth: 580,
        }}>
          Spaces, courses, and events for premium creators. 0% transaction fees, forever.
        </p>
        
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginBottom: 68, position: 'relative' }}>
          <Link href="/sign-up" style={{
            padding: '16px 32px', 
            borderRadius: 12, 
            fontWeight: 700, 
            fontSize: 18,
            background: 'oklch(0.20 0.02 250)', 
            color: '#fff', 
            textDecoration: 'none',
            boxShadow: '0 20px 40px -10px oklch(0.20 0.02 250 / 0.3)',
            transition: 'transform 0.2s ease',
          }}>Start a 14-day trial</Link>
          
          {/* Re-aligned doodle and text */}
          <DoodleSquiggleArrow color={DOODLE_COLORS.ink} rotate={-15}
            style={{ left: 'calc(50% - 240px)', top: -35 }} />
          <span style={{
            position: 'absolute', 
            left: 'calc(50% - 340px)', 
            top: -20,
            fontFamily: 'var(--font-gochi), cursive',
            fontSize: 22, 
            color: DOODLE_COLORS.ink, 
            transform: 'rotate(-8deg)', 
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            letterSpacing: '0.02em',
          }}>start here</span>
          <DoodleSpark style={{ right: 'calc(50% - 280px)', top: 8 }} size={18} color={DOODLE_COLORS.green} />
        </div>

        {/* Product canvas peek */}
        <div style={{
          maxWidth: 980, 
          margin: '0 auto',
          background: 'oklch(0.985 0.003 250)', 
          borderRadius: 16,
          border: '1px solid oklch(0.92 0.01 250)',
          padding: 14,
          boxShadow: '0 30px 60px -30px oklch(0.30 0.04 250 / 0.3)',
          position: 'relative',
        }}>
          <DoodleStar style={{ top: -22, left: -28 }} size={26} color={DOODLE_COLORS.lilac} />
          <DoodleHeart style={{ bottom: -16, left: -20 }} size={20} color={DOODLE_COLORS.warm} />
          <DoodleStar style={{ top: -20, right: -22 }} size={22} color={DOODLE_COLORS.green} />
          
          <div style={{
            display: 'grid', 
            gridTemplateColumns: '180px 1fr 200px', 
            gap: 14, 
            textAlign: 'left',
          }}>
            {/* Sidebar peek */}
            <div style={{
              background: '#fff', 
              borderRadius: 10, 
              padding: '14px 12px',
              border: '1px solid oklch(0.94 0.005 250)',
            }}>
              <p style={{ fontSize: 10, fontWeight: 600, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'oklch(0.55 0.02 250)' }}>Spaces</p>
              {mockSpaces.map((s, i) => (
                <div key={s.id} style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  padding: '5px 6px',
                  borderRadius: 6, 
                  fontSize: 12,
                  background: i === 0 ? 'oklch(0.96 0.005 250)' : 'transparent',
                  fontWeight: i === 0 ? 600 : 400,
                  color: 'oklch(0.30 0.02 250)',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: `oklch(0.62 0.16 ${s.hue})` }}/>
                  {s.name}
                </div>
              ))}
            </div>

            {/* Content peek */}
            <div style={{
              background: '#fff', 
              borderRadius: 10, 
              padding: '16px 18px',
              border: '1px solid oklch(0.94 0.005 250)',
            }}>
              <div style={{ paddingBottom: 12, borderBottom: '1px solid oklch(0.95 0.005 250)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Avatar person={mockUser} size={22} presence />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{mockUser.name}</span>
                  <span style={{
                    padding: '1px 8px', 
                    borderRadius: 999, 
                    fontSize: 10, 
                    fontWeight: 600,
                    background: 'oklch(0.96 0.02 42)', 
                    color: 'oklch(0.36 0.10 42)',
                  }}>Announcements</span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Office hours moving to Thursdays</p>
                <p style={{ fontSize: 12, color: 'oklch(0.40 0.02 250)', margin: '0 0 8px', lineHeight: 1.45 }}>
                  We’re shifting weekly office hours to a more global-friendly slot. RSVP in the calendar…
                </p>
                <Reactions items={[['✨', 24], ['❤️', 18]]} hue={42} />
              </div>
            </div>

            {/* Right rail peek */}
            <div style={{
              background: '#fff', 
              borderRadius: 10, 
              padding: '14px 12px',
              border: '1px solid oklch(0.94 0.005 250)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%',
                  background: 'oklch(0.62 0.18 150)',
                }}/>
                <p style={{ fontSize: 10, fontWeight: 700, margin: 0, color: 'oklch(0.42 0.14 150)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live now</p>
              </div>
              {mockOnline.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                  <Avatar person={p} size={20} presence />
                  <span style={{ fontSize: 12, color: 'oklch(0.30 0.02 250)' }}>{p.name.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
