'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Check your email</h2>
        <p style={{ color: '#555', fontSize: 15 }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your
          account.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center' }}>
        Create your account
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          style={inputStyle}
        />
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
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          style={inputStyle}
        />
        {error && <p style={{ color: '#c00', fontSize: 14, margin: 0 }}>{error}</p>}
        <button type="submit" disabled={loading} style={btnPrimaryStyle}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, marginTop: 24, color: '#666' }}>
        Already have an account?{' '}
        <Link href="/sign-in" style={{ color: '#000', fontWeight: 600 }}>
          Sign in
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
