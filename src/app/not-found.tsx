import Link from 'next/link';
import { GILD_FONTS } from '@/components/gild';

export default function NotFound() {
  return (
    <div
      style={{
        fontFamily: GILD_FONTS.sans,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
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
        404
      </p>
      <h1
        style={{
          fontFamily: GILD_FONTS.display,
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: '-0.04em',
          margin: '0 0 12px',
          lineHeight: 1.05,
        }}
      >
        Page not found
      </h1>
      <p
        style={{
          fontSize: 16,
          color: 'oklch(0.55 0.02 250)',
          margin: '0 0 28px',
          lineHeight: 1.5,
        }}
      >
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          padding: '10px 20px',
          borderRadius: 14,
          background: '#111',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Go home
      </Link>
    </div>
  );
}
