'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wordmark, GILD_FONTS } from '@/components/gild';
import { AuthShowcase } from '@/components/AuthShowcase';
import { signUp } from '@/lib/auth/actions';
import { trackSignup } from '@/lib/analytics/events';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('displayName', displayName);
    formData.append('username', email.split('@')[0] ?? email); // Default username

    try {
      const { data, error: authError } = await signUp(formData);
      setLoading(false);
      
      if (authError) {
        setError(authError.message);
        return;
      }
      
      trackSignup('email_password');

      // No session yet → email confirmation is pending. Show the inbox
      // notice instead of pushing into /onboarding, which the middleware
      // would bounce straight back to /sign-in for an unauthenticated user.
      if (data?.needsEmailConfirmation) {
        setDone(true);
      } else {
        window.location.href = '/onboarding';
      }
    } catch {
      setLoading(false);
      setError('An unexpected error occurred. Please try again.');
    }
  }

  return (
    <div
      className="gild-auth-grid"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        background: '#fff',
        fontFamily: GILD_FONTS.sans,
        zIndex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 12%',
          position: 'relative',
          overflow: 'auto',
        }}
      >
        <div style={{ position: 'absolute', top: 48, left: '12%' }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Wordmark size={32} />
          </Link>
        </div>

        <div style={{ maxWidth: 420, width: '100%' }}>
          {done ? (
            <>
              <h1
                style={{
                  fontFamily: GILD_FONTS.display,
                  fontSize: 48,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  margin: '0 0 20px',
                  color: '#111',
                  lineHeight: 1,
                }}
              >
                Check your email.
              </h1>
              <p
                style={{
                  fontSize: 18,
                  color: 'oklch(0.55 0.02 250)',
                  lineHeight: 1.5,
                  marginBottom: 24,
                }}
              >
                We sent a confirmation link to <strong style={{ color: '#111' }}>{email}</strong>.
                Click it to activate your account.
              </p>
              <p style={{ fontSize: 15, color: 'oklch(0.55 0.02 250)' }}>
                Wrong email?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setDone(false);
                    setError(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#111',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 15,
                    padding: 0,
                    fontFamily: 'inherit',
                  }}
                >
                  Try again
                </button>
              </p>
            </>
          ) : (
            <>
              <h1
                style={{
                  fontFamily: GILD_FONTS.display,
                  fontSize: 56,
                  fontWeight: 800,
                  letterSpacing: '-0.04em',
                  margin: '0 0 20px',
                  color: '#111',
                  lineHeight: 1,
                }}
              >
                Create account.
              </h1>
              <p
                style={{
                  fontSize: 18,
                  color: 'oklch(0.55 0.02 250)',
                  marginBottom: 48,
                  lineHeight: 1.5,
                }}
              >
                The internet is noisy. Build a quiet place for your people to gather.
              </p>

              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <input
                  type="text"
                  placeholder="How should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete="name"
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  style={inputStyle}
                />
                <input
                  type="password"
                  placeholder="A strong password (8+ chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  style={inputStyle}
                />
                {error && (
                  <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{error}</p>
                )}
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
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? 'Creating account…' : 'Sign up'}
                </button>
              </form>

              <p
                style={{
                  marginTop: 16,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: 'oklch(0.55 0.02 250)',
                  textAlign: 'center',
                }}
              >
                By creating an account, you agree to our{' '}
                <Link href="/terms" style={{ color: '#111', fontWeight: 600, textDecoration: 'underline' }}>
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" style={{ color: '#111', fontWeight: 600, textDecoration: 'underline' }}>
                  Privacy Policy
                </Link>
                .
              </p>

              <p
                style={{
                  marginTop: 24,
                  fontSize: 15,
                  color: 'oklch(0.55 0.02 250)',
                  textAlign: 'center',
                }}
              >
                Already have an account?{' '}
                <Link href="/sign-in" style={{ color: '#111', fontWeight: 600, textDecoration: 'none' }}>
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <AuthShowcase variant="sign-up" />

      <style>{`
        @media (max-width: 860px) {
          .gild-auth-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
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
  color: '#111',
  boxSizing: 'border-box',
};
