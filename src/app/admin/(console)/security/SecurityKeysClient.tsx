'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { KeyRound, Trash2, ShieldCheck, ShieldAlert, Smartphone, Usb } from 'lucide-react';
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

export default function SecurityKeysClient({ credentials: initial }: Props) {
  const [creds, setCreds] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const lastKey = creds.length === 1;

  function handleDelete(id: string) {
    if (lastKey) return; // belt-and-braces; button is also disabled
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
    <div className="flex flex-col gap-5">
      {/* Banner — only one key registered */}
      {lastKey && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-amber-700/40 bg-amber-950/30 p-4"
        >
          <ShieldAlert className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold text-amber-200 mb-1">Single point of failure</p>
            <p className="text-amber-100/70">
              You only have one key registered. Lose this device and recovery
              requires running an SQL migration to bootstrap a new admin.
              Register a backup before doing anything else here.
            </p>
          </div>
        </div>
      )}

      {/* Add key — placeholder until the register-new-key ceremony is built */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center">
            <KeyRound size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold mb-1">Add a security key</h2>
            <p className="text-sm text-neutral-400 leading-relaxed max-w-prose">
              Browser-side WebAuthn ceremony required. The registration flow
              uses the same API as the initial bootstrap — head to{' '}
              <Link href="/admin/setup" className="text-neutral-200 underline hover:text-white">
                /admin/setup
              </Link>{' '}
              and re-run it with your second device. (A dedicated add-key
              page is on the backlog.)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {/* Key list */}
      {creds.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-10 text-center">
          <ShieldCheck className="text-neutral-600 mx-auto mb-3" size={28} />
          <p className="text-sm font-semibold text-neutral-200 mb-1">No keys registered</p>
          <p className="text-xs text-neutral-500">
            You should not be able to see this page without a registered key. Contact platform support.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 list-none p-0 m-0">
          {creds.map((c) => {
            const Icon = transportIcon(c.transports);
            return (
              <li
                key={c.id}
                className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-4"
                style={{ opacity: busyId === c.id ? 0.5 : 1 }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neutral-800 text-neutral-300 flex items-center justify-center">
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-neutral-100">
                      {c.friendly_name ?? 'Unnamed key'}
                    </span>
                    {c.backed_up && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/40">
                        Backed up
                      </span>
                    )}
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-neutral-500 border border-neutral-800">
                      {c.device_type === 'singleDevice'
                        ? 'Single device'
                        : c.device_type === 'multiDevice'
                          ? 'Multi-device'
                          : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-[11px] text-neutral-500 font-mono tracking-wide">
                    <span>ID: {c.credential_id.slice(0, 12)}…</span>
                    <span>Last used: {relativeTime(c.last_used_at)}</span>
                    <span>Added: {relativeTime(c.created_at)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={lastKey || busyId === c.id}
                  title={lastKey ? 'Register a backup key before revoking your only key' : 'Revoke key'}
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold border border-neutral-800 text-neutral-400 hover:border-red-900/50 hover:text-red-300 hover:bg-red-950/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-400 disabled:hover:border-neutral-800"
                >
                  <Trash2 size={12} />
                  Revoke
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
