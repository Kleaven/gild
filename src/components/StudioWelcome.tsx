'use client';

import React from 'react';
import Link from 'next/link';
import {
  Wordmark,
  GILD_FONTS,
  DoodleStar,
  DoodleSpark,
  DoodleUnderline,
  DOODLE_COLORS,
} from '@/components/gild';

export function StudioWelcome() {
  return (
    <main
      style={{
        fontFamily: GILD_FONTS.sans,
        background: '#fff',
        minHeight: '100vh',
        color: '#202020',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 28px',
          borderBottom: '1px solid oklch(0.95 0.005 250)',
        }}
      >
        <Wordmark size={22} />
      </header>

      <DoodleStar style={{ top: 120, left: '12%' }} size={28} color={DOODLE_COLORS.warm} />
      <DoodleSpark style={{ top: 220, right: '14%' }} size={20} color={DOODLE_COLORS.green} />
      <DoodleStar style={{ top: 320, right: '8%' }} size={22} color={DOODLE_COLORS.lilac} />

      <section
        style={{
          maxWidth: 640,
          margin: '0 auto',
          padding: '120px 28px 60px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <h1
          style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 56,
            lineHeight: 1.0,
            fontWeight: 800,
            margin: '0 0 20px',
            letterSpacing: '-0.04em',
            position: 'relative',
            display: 'inline-block',
          }}
        >
          Welcome to Gild
          <DoodleUnderline
            w={180}
            color={DOODLE_COLORS.warm}
            style={{ left: '50%', bottom: -12, transform: 'translateX(-50%)' }}
          />
        </h1>

        <p
          style={{
            fontSize: 18,
            lineHeight: 1.5,
            color: 'oklch(0.42 0.02 250)',
            margin: '0 auto 36px',
            maxWidth: 460,
          }}
        >
          You&apos;re not part of any community yet. Join a space that inspires you or start your own.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link
            href="/communities"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              background: 'oklch(0.20 0.02 250)',
              color: '#fff',
              textDecoration: 'none',
              boxShadow: '0 20px 40px -10px oklch(0.20 0.02 250 / 0.3)',
            }}
          >
            Discover communities
          </Link>
          <Link
            href="/communities/new"
            style={{
              display: 'inline-block',
              padding: '14px 28px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              background: '#fff',
              color: 'oklch(0.20 0.02 250)',
              border: '1px solid oklch(0.90 0.01 250)',
              textDecoration: 'none',
            }}
          >
            Start a community
          </Link>
        </div>
      </section>
    </main>
  );
}
