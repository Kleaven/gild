'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import { getRegistrationOptions, verifyAndExchangeToken } from './actions';

export default function WebAuthnSetupForm({
  adminId,
  adminEmail,
  setupToken,
}: {
  adminId: string;
  adminEmail: string;
  setupToken: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      const { options, error: optError } = await getRegistrationOptions(adminId, adminEmail, setupToken);
      if (optError || !options) {
        throw new Error(optError || 'Failed to generate options');
      }

      let response;
      try {
        response = await startRegistration({ optionsJSON: options });
      } catch (err: unknown) {
        // Handle User Cancelled or timeout
        if (err instanceof Error) {
          throw new Error(err.message);
        }
        throw new Error('Registration failed in browser');
      }

      const { success, error: verifyError } = await verifyAndExchangeToken(adminId, setupToken, response);
      
      if (verifyError || !success) {
        throw new Error(verifyError || 'Verification failed');
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
    <div className="flex flex-col space-y-4">
      {error && (
        <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
          {error}
        </div>
      )}
      
      <button
        onClick={handleRegister}
        disabled={loading}
        className="flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 transition-colors"
      >
        {loading ? 'Waiting for Authenticator...' : 'Register Security Key / Touch ID'}
      </button>
    </div>
  );
}
