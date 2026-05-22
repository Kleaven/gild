'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';
import { getAddKeyRegistrationOptions, verifyAndAddKey } from './actions';

export default function AddKeyForm() {
  const router = useRouter();
  const [friendlyName, setFriendlyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    try {
      const optionsResult = await getAddKeyRegistrationOptions();
      if (!optionsResult.ok) {
        throw new Error(optionsResult.message);
      }

      let attestation;
      try {
        attestation = await startRegistration({ optionsJSON: optionsResult.options });
      } catch (err) {
        if (err instanceof Error) {
          // Most common failure: user already registered THIS key on this
          // admin — excludeCredentials makes the browser refuse with an
          // InvalidStateError. Surface a friendlier message.
          if (err.name === 'InvalidStateError') {
            throw new Error('This security key is already registered on your admin account. Use a different one.');
          }
          throw err;
        }
        throw new Error('WebAuthn registration was cancelled or failed in the browser.');
      }

      const verifyResult = await verifyAndAddKey(attestation, friendlyName);
      if (!verifyResult.ok) {
        throw new Error(verifyResult.message);
      }

      router.push('/admin/security');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <label
        htmlFor="friendly-name"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: GILD_ADMIN_TOKENS.text.subtle,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: GILD_FONTS.mono,
        }}
      >
        Friendly name
      </label>
      <input
        id="friendly-name"
        type="text"
        value={friendlyName}
        onChange={(e) => setFriendlyName(e.target.value)}
        placeholder="e.g. YubiKey 5C, iPhone passkey, Backup TouchID"
        maxLength={64}
        disabled={loading}
        style={{
          background: GILD_ADMIN_TOKENS.bg.surface,
          border: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 14,
          color: GILD_ADMIN_TOKENS.text.primary,
          fontFamily: GILD_FONTS.sans,
          outline: 'none',
        }}
      />

      {error && (
        <p
          role="alert"
          style={{
            borderRadius: 8,
            border: `1px solid ${GILD_ADMIN_TOKENS.status.errorBorder}`,
            background: GILD_ADMIN_TOKENS.status.errorBg,
            padding: '10px 14px',
            fontSize: 13,
            color: GILD_ADMIN_TOKENS.status.errorText,
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleRegister}
        disabled={loading}
        style={{
          background: loading ? GILD_ADMIN_TOKENS.bg.raised : GILD_ADMIN_TOKENS.text.primary,
          color: loading ? GILD_ADMIN_TOKENS.text.muted : GILD_ADMIN_TOKENS.bg.canvas,
          border: 'none',
          borderRadius: 8,
          padding: '10px 16px',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: GILD_FONTS.sans,
          transition: 'background-color 150ms ease',
        }}
      >
        {loading ? 'Waiting for authenticator…' : 'Register security key'}
      </button>

      <p
        style={{
          fontSize: 12,
          color: GILD_ADMIN_TOKENS.text.subtle,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Tap your security key, hold your device near this machine for a passkey,
        or use the platform authenticator (TouchID / FaceID / Windows Hello).
        The browser will refuse to register a key you&rsquo;ve already added.
      </p>
    </div>
  );
}
