'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.push('/');
    router.refresh();
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
        Sign in to Gild
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />
        {error && <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={btnPrimaryStyle}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div style={{ textAlign: 'center', margin: '16px 0', color: '#aaa', fontSize: 13 }}>or</div>

      <button onClick={handleGoogle} style={btnSecondaryStyle}>
        Continue with Google
      </button>

      <p style={{ textAlign: 'center', fontSize: 14, marginTop: 24, color: '#666' }}>
        No account?{' '}
        <Link href="/sign-up" style={{ color: '#000', fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1.5px solid #ddd',
  borderRadius: 8,
  fontSize: 15,
  outline: 'none',
};

const btnPrimaryStyle: React.CSSProperties = {
  background: '#000',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '11px 0',
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 4,
};

const btnSecondaryStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  color: '#333',
  border: '1.5px solid #ddd',
  borderRadius: 8,
  padding: '11px 0',
  fontSize: 15,
  fontWeight: 500,
  cursor: 'pointer',
};
