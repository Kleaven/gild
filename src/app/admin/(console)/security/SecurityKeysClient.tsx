'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { KeyRound, Trash2, ShieldCheck, ShieldAlert, Smartphone, Usb } from 'lucide-react';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';
import { deleteWebAuthnKey } from '@/app/actions';

type Credential = {
  id: string;
  credential_id: string;
  friendly_name: string | null;
  device_type: string;
  backed_up: boolean;
  transports: string[] | null;
  last_used_at: string | null;
  created_at: string;
};

type Props = { credentials: Credential[] };

function relativeTime(iso: string | null): string {
  if (!iso) return 'never';
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const diffDay = Math.floor(diffSec / 86400);
  if (diffDay < 14) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function transportIcon(transports: string[] | null) {
  if (transports?.includes('internal')) return Smartphone;
  if (transports?.includes('usb')) return Usb;
  return KeyRound;
}

type CredentialRowProps = {
  credential: Credential;
  lastKey: boolean;
  busy: boolean;
  onDelete: () => void;
};

function CredentialRow({ credential: c, lastKey, busy, onDelete }: CredentialRowProps) {
  const Icon = transportIcon(c.transports);
  const [hover, setHover] = useState(false);
  const disabled = lastKey || busy;

  const buttonBorder = disabled
    ? GILD_ADMIN_TOKENS.border.default
    : hover
      ? GILD_ADMIN_TOKENS.status.errorHoverBorder
      : GILD_ADMIN_TOKENS.border.default;
  const buttonColor = disabled
    ? GILD_ADMIN_TOKENS.text.muted
    : hover
      ? GILD_ADMIN_TOKENS.status.errorHoverText
      : GILD_ADMIN_TOKENS.text.muted;
  const buttonBg = disabled || !hover ? 'transparent' : GILD_ADMIN_TOKENS.status.errorHoverBg;

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        borderRadius: 8,
        border: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
        background: GILD_ADMIN_TOKENS.bg.surfaceFaint,
        padding: 16,
        opacity: busy ? 0.5 : 1,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 40,
          height: 40,
          borderRadius: 8,
          background: GILD_ADMIN_TOKENS.bg.raised,
          color: GILD_ADMIN_TOKENS.text.secondary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: GILD_ADMIN_TOKENS.text.body }}>
            {c.friendly_name ?? 'Unnamed key'}
          </span>
          {c.backed_up && (
            <span
              style={{
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 10,
                fontFamily: GILD_FONTS.mono,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                background: GILD_ADMIN_TOKENS.status.badgeOkBg,
                color: GILD_ADMIN_TOKENS.status.badgeOkText,
                border: `1px solid ${GILD_ADMIN_TOKENS.status.badgeOkBorder}`,
              }}
            >
              Backed up
            </span>
          )}
          <span
            style={{
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 10,
              fontFamily: GILD_FONTS.mono,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: GILD_ADMIN_TOKENS.text.subtle,
              border: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
            }}
          >
            {c.device_type === 'singleDevice'
              ? 'Single device'
              : c.device_type === 'multiDevice'
                ? 'Multi-device'
                : 'Unknown'}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: 11,
            color: GILD_ADMIN_TOKENS.text.subtle,
            fontFamily: GILD_FONTS.mono,
            letterSpacing: '0.02em',
          }}
        >
          <span>ID: {c.credential_id.slice(0, 12)}…</span>
          <span>Last used: {relativeTime(c.last_used_at)}</span>
          <span>Added: {relativeTime(c.created_at)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={disabled}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        title={lastKey ? 'Register a backup key before revoking your only key' : 'Revoke key'}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 600,
          border: `1px solid ${buttonBorder}`,
          color: buttonColor,
          background: buttonBg,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transition: 'color 150ms ease, border-color 150ms ease, background-color 150ms ease',
          fontFamily: GILD_FONTS.mono,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <Trash2 size={12} />
        Revoke
      </button>
    </li>
  );
}

export default function SecurityKeysClient({ credentials: initial }: Props) {
  const [creds, setCreds] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const lastKey = creds.length === 1;

  function handleDelete(id: string) {
    if (lastKey) return;
    if (!confirm('Revoke this security key? This cannot be undone.')) return;

    const snapshot = creds;
    setCreds((prev) => prev.filter((c) => c.id !== id));
    setBusyId(id);
    setError(null);

    startTransition(async () => {
      const res = await deleteWebAuthnKey(id);
      if (!res.ok) {
        setCreds(snapshot);
        setError(res.message);
      }
      setBusyId(null);
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Banner — only one key registered */}
      {lastKey && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            borderRadius: 8,
            border: `1px solid ${GILD_ADMIN_TOKENS.status.warnBannerBorder}`,
            background: GILD_ADMIN_TOKENS.status.warnBannerBg,
            padding: 16,
          }}
        >
          <ShieldAlert
            color={GILD_ADMIN_TOKENS.accent.warning}
            style={{ flexShrink: 0, marginTop: 2 }}
            size={18}
          />
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>
            <p style={{ fontWeight: 600, color: GILD_ADMIN_TOKENS.status.warnBannerHead, marginBottom: 4 }}>
              Single point of failure
            </p>
            <p style={{ color: GILD_ADMIN_TOKENS.status.warnBannerBody }}>
              You only have one key registered. Lose this device and recovery
              requires running an SQL migration to bootstrap a new admin.
              Register a backup before doing anything else here.
            </p>
          </div>
        </div>
      )}

      {/* Add key — placeholder until the register-new-key ceremony is built */}
      <div
        style={{
          borderRadius: 8,
          border: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
          background: GILD_ADMIN_TOKENS.bg.surfaceFaint,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: 8,
              background: GILD_ADMIN_TOKENS.bg.raised,
              color: GILD_ADMIN_TOKENS.text.secondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <KeyRound size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                marginBottom: 4,
                color: GILD_ADMIN_TOKENS.text.primary,
                fontFamily: GILD_FONTS.display,
              }}
            >
              Add a security key
            </h2>
            <p
              style={{
                fontSize: 14,
                color: GILD_ADMIN_TOKENS.text.muted,
                lineHeight: 1.5,
                maxWidth: '65ch',
              }}
            >
              Browser-side WebAuthn ceremony required. The registration flow
              uses the same API as the initial bootstrap — head to{' '}
              <Link
                href="/admin/setup"
                style={{
                  color: GILD_ADMIN_TOKENS.text.body,
                  textDecoration: 'underline',
                }}
              >
                /admin/setup
              </Link>{' '}
              and re-run it with your second device. (A dedicated add-key
              page is on the backlog.)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            borderRadius: 8,
            border: `1px solid ${GILD_ADMIN_TOKENS.status.errorBorder}`,
            background: GILD_ADMIN_TOKENS.status.errorBg,
            padding: '12px 16px',
            fontSize: 14,
            color: GILD_ADMIN_TOKENS.status.errorText,
            margin: 0,
          }}
        >
          {error}
        </p>
      )}

      {/* Key list */}
      {creds.length === 0 ? (
        <div
          style={{
            borderRadius: 8,
            border: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
            background: GILD_ADMIN_TOKENS.bg.surfaceFaint,
            padding: 40,
            textAlign: 'center',
          }}
        >
          <ShieldCheck
            color={GILD_ADMIN_TOKENS.text.faint}
            style={{ margin: '0 auto 12px', display: 'block' }}
            size={28}
          />
          <p style={{ fontSize: 14, fontWeight: 600, color: GILD_ADMIN_TOKENS.text.body, marginBottom: 4 }}>
            No keys registered
          </p>
          <p style={{ fontSize: 12, color: GILD_ADMIN_TOKENS.text.subtle }}>
            You should not be able to see this page without a registered key. Contact platform support.
          </p>
        </div>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, margin: 0 }}>
          {creds.map((c) => (
            <CredentialRow
              key={c.id}
              credential={c}
              lastKey={lastKey}
              busy={busyId === c.id}
              onDelete={() => handleDelete(c.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
