'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wordmark, GILD_FONTS } from '@/components/gild';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/onboarding');
      router.refresh();
    }, 500);
  }

  async function handleGoogle() {
    setLoading(true);
    setTimeout(() => {
      router.push('/onboarding');
      router.refresh();
    }, 500);
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1.2fr 1fr', 
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
            Welcome back.
          </h1>
          <p style={{ 
            fontSize: 18, 
            color: 'oklch(0.55 0.02 250)', 
            marginBottom: 48,
            lineHeight: 1.5,
          }}>
            Pick up where you left off. Join the conversation with your community.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={handleGoogle}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '14px 24px',
                borderRadius: 14,
                border: '1px solid oklch(0.90 0.01 250)',
                background: '#fff',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '12px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'oklch(0.95 0.005 250)' }}/>
              <span style={{ fontSize: 13, color: 'oklch(0.65 0.01 250)', fontWeight: 500 }}>
                or use email
              </span>
              <div style={{ flex: 1, height: 1, background: 'oklch(0.95 0.005 250)' }}/>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: 14,
                  background: '#111',
                  color: '#fff',
                  border: 'none',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading ? 'default' : 'pointer',
                  marginTop: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>

            <p style={{ marginTop: 24, fontSize: 15, color: 'oklch(0.55 0.02 250)', textAlign: 'center' }}>
              New here?{' '}
              <Link href="/sign-up" style={{ color: '#111', fontWeight: 600, textDecoration: 'none' }}>
                Create an account
              </Link>
            </p>
          </div>
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
          src="/images/SignInPage.png" 
          alt="Gild Community" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            objectPosition: 'left center', // Ensures characters on the left are not cut off
            display: 'block',
          }} 
        />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 20px',
  borderRadius: 14,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 16,
  outline: 'none',
  background: '#fff',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s ease',
};
