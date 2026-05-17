'use client';

import { useEffect } from 'react';
import { GILD_FONTS } from '@/components/gild';

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[gild] community error:', error);
  }, [error]);

  return (
    <div
      style={{
        fontFamily: GILD_FONTS.sans,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 49px)',
        padding: '40px 20px',
        color: '#111',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: GILD_FONTS.mono,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'oklch(0.55 0.02 250)',
          margin: '0 0 12px',
          textTransform: 'uppercase',
        }}
      >
        Error
      </p>
      <h2
        style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          margin: '0 0 12px',
          lineHeight: 1.1,
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          fontSize: 15,
          color: 'oklch(0.55 0.02 250)',
          margin: '0 0 28px',
          lineHeight: 1.5,
          maxWidth: 420,
        }}
      >
        An unexpected error occurred. Try again or contact support if the
        problem persists.
      </p>
      <button
        onClick={reset}
        style={{
          appearance: 'none',
          border: 'none',
          background: '#111',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: 14,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: GILD_FONTS.sans,
        }}
      >
        Try again
      </button>
      {error.digest && (
        <p
          style={{
            marginTop: 16,
            fontSize: 11,
            color: 'oklch(0.70 0.01 250)',
            fontFamily: GILD_FONTS.mono,
          }}
        >
          ref: {error.digest}
        </p>
      )}
    </div>
  );
}
