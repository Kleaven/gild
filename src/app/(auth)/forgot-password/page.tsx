'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wordmark, GILD_FONTS } from '@/components/gild';
import { requestPasswordReset } from '@/lib/auth/actions';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    try {
      const res = await requestPasswordReset(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: GILD_FONTS.sans, textAlign: 'left' }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Wordmark size={26} />
        </Link>
      </div>

      {sent ? (
        <>
          <h1 style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 12px',
            color: '#111',
          }}>
            Check your email.
          </h1>
          <p style={{ fontSize: 15, color: 'oklch(0.50 0.02 250)', lineHeight: 1.6, margin: '0 0 24px' }}>
            If an account exists for <strong style={{ color: '#111' }}>{email}</strong>, we’ve
            sent a link to reset your password. The link expires after a short while.
          </p>
          <Link href="/sign-in" style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
            ← Back to sign in
          </Link>
        </>
      ) : (
        <>
          <h1 style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 8px',
            color: '#111',
          }}>
            Reset your password.
          </h1>
          <p style={{ fontSize: 15, color: 'oklch(0.50 0.02 250)', lineHeight: 1.6, margin: '0 0 24px' }}>
            Enter your email and we’ll send you a link to set a new one.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid oklch(0.90 0.01 250)',
                fontSize: 15,
                outline: 'none',
                fontFamily: 'inherit',
                color: '#111',
                boxSizing: 'border-box',
              }}
            />
            {error && <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 12,
                background: '#111',
                color: '#fff',
                border: 'none',
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1,
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 14, color: 'oklch(0.55 0.02 250)' }}>
            Remembered it?{' '}
            <Link href="/sign-in" style={{ color: '#111', fontWeight: 600, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
