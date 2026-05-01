'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startAuthentication } from '@simplewebauthn/browser';
import { getAuthOptions, verifyAuthAndExchangeToken } from './actions';

export default function WebAuthnLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { options, adminId, error: optError } = await getAuthOptions(email);
      if (optError || !options || !adminId) {
        throw new Error(optError || 'Authentication failed');
      }

      let response;
      try {
        response = await startAuthentication({ optionsJSON: options });
      } catch (err: unknown) {
        if (err instanceof Error) {
          throw new Error(err.message);
        }
        throw new Error('Authentication failed in browser');
      }

      const { success, error: verifyError } = await verifyAuthAndExchangeToken(adminId, email, response);
      
      if (verifyError || !success) {
        throw new Error(verifyError || 'Authentication failed');
      }

      router.push('/admin');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="flex flex-col space-y-4">
      {error && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-1">
          Admin Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="admin@gild.test"
          className="block w-full rounded-md border-0 bg-neutral-800 py-1.5 text-white shadow-sm ring-1 ring-inset ring-neutral-700 focus:ring-2 focus:ring-inset focus:ring-white sm:text-sm sm:leading-6 px-3"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !email}
        className="flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 transition-colors"
      >
        {loading ? 'Waiting for Authenticator...' : 'Log in with Security Key'}
      </button>
    </form>
  );
}
