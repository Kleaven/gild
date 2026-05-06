'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wordmark, 
  GILD_FONTS, 
} from '@/components/gild';

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/onboarding');
      router.refresh();
    }, 500);
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      minHeight: '100vh', 
      background: '#fff',
      fontFamily: GILD_FONTS.sans,
    }}>
      {/* Left side: Form */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '0 12%',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: 48, left: '12%' }}>
          <Wordmark size={32} />
        </div>

        <div style={{ maxWidth: 420, width: '100%' }}>
          <h1 style={{ 
            fontFamily: GILD_FONTS.display, 
            fontSize: 56, 
            fontWeight: 800, 
            letterSpacing: '-0.04em', 
            margin: '0 0 20px',
            color: '#111',
            lineHeight: 1,
          }}>
            Create account.
          </h1>
          <p style={{ 
            fontSize: 18, 
            color: 'oklch(0.55 0.02 250)', 
            marginBottom: 48,
            lineHeight: 1.5,
          }}>
            The internet is noisy. Build a quiet place for your people to gather.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="text"
              placeholder="How should we call you?"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              minLength={2}
              maxLength={50}
              style={inputStyle}
            />
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="password"
              placeholder="A strong password (8+ chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 24px',
                borderRadius: 14,
                background: '#111',
                color: '#fff',
                border: 'none',
                fontSize: 16,
                fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                marginTop: 8,
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 10px 20px -5px oklch(0.20 0.02 250 / 0.15)',
              }}
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 15, color: 'oklch(0.55 0.02 250)', textAlign: 'center' }}>
            Already have an account?{' '}
            <Link href="/sign-in" style={{ color: '#111', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side: Pure Image Reveal (Full Bleed) */}
      <div style={{ 
        background: '#fff', 
        display: 'flex', 
        borderLeft: '1px solid oklch(0.94 0.01 250)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <img 
          src="/images/SignUpPage.png" 
          alt="Gild Community" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            objectPosition: 'left center', // Anchors characters on the left
            display: 'block',
          }} 
        />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px 20px',
  borderRadius: 14,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 16,
  outline: 'none',
  background: '#fff',
  fontFamily: 'inherit',
};
