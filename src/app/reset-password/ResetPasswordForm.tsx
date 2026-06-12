'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wordmark, GILD_FONTS } from '@/components/gild';
import { updatePassword } from '@/lib/auth/actions';

export function ResetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords don’t match.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('password', password);
    try {
      const res = await updatePassword(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1600);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9f9f9',
      fontFamily: GILD_FONTS.sans,
      padding: 20,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 420,
        border: '1px solid oklch(0.93 0.005 250)',
        boxShadow: '0 12px 32px oklch(0 0 0 / 0.05)',
      }}>
        <div style={{ marginBottom: 28 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Wordmark size={26} />
          </Link>
        </div>

        {done ? (
          <>
            <h1 style={{
              fontFamily: GILD_FONTS.display, fontSize: 26, fontWeight: 800,
              letterSpacing: '-0.03em', margin: '0 0 10px', color: '#111',
            }}>
              Password updated. ✓
            </h1>
            <p style={{ fontSize: 15, color: 'oklch(0.50 0.02 250)', lineHeight: 1.6, margin: 0 }}>
              You’re signed in — taking you home…
            </p>
          </>
        ) : (
          <>
            <h1 style={{
              fontFamily: GILD_FONTS.display, fontSize: 26, fontWeight: 800,
              letterSpacing: '-0.03em', margin: '0 0 8px', color: '#111',
            }}>
              Choose a new password.
            </h1>
            <p style={{ fontSize: 14.5, color: 'oklch(0.50 0.02 250)', lineHeight: 1.6, margin: '0 0 24px' }}>
              Resetting the password for <strong style={{ color: '#111' }}>{email}</strong>.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input
                type="password"
                placeholder="New password (8+ characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                autoFocus
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                style={inputStyle}
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
                {loading ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 15,
  outline: 'none',
  fontFamily: 'inherit',
  color: '#111',
  boxSizing: 'border-box',
};
