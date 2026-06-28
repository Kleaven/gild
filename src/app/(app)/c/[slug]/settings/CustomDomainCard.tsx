'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Globe, Check, Lock, Copy, RefreshCw, ArrowRight, ExternalLink } from 'lucide-react';
import { setCommunityDomain, verifyCommunityDomain, removeCommunityDomain } from '@/app/actions';

type Status = 'pending' | 'active' | 'error' | null;
interface Dns { type: 'A' | 'CNAME'; name: string; value: string }

interface Props {
  communityId: string;
  slug: string;
  isPro: boolean;
  themeHue: number;
  initialDomain: string | null;
  initialStatus: Status;
  initialDns: Dns | null;
}

// Tokens lifted from CommunitySettings so this section is visually identical
// to the rest of the page — same ramp, same radii, same control vocabulary.
const INK = 'oklch(0.40 0.02 250)';
const MUTED = 'oklch(0.52 0.02 250)';
const HAIRLINE = 'oklch(0.90 0.01 250)';
const SURFACE = 'oklch(0.975 0.006 250)';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: `1px solid ${HAIRLINE}`, fontSize: 14, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 600, color: INK, marginBottom: 8,
};

export default function CustomDomainCard({
  communityId, slug, isPro, themeHue, initialDomain, initialStatus, initialDns,
}: Props) {
  const [domain, setDomain] = useState(initialDomain ?? '');
  const [status, setStatus] = useState<Status>(initialStatus);
  const [dns, setDns] = useState<Dns | null>(initialDns);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const primary = `oklch(0.20 0.02 ${themeHue})`;

  function connect() {
    setError(null); setNotice(null);
    startTransition(async () => {
      const r = await setCommunityDomain(communityId, input);
      if (!r.ok) { setError(r.error); return; }
      setDomain(r.state.domain ?? ''); setStatus(r.state.status); setDns(r.state.dns);
    });
  }
  function verify() {
    setError(null); setNotice(null);
    startTransition(async () => {
      const r = await verifyCommunityDomain(communityId);
      if (!r.ok) { setError(r.error); if (r.error) setStatus('pending'); return; }
      setStatus(r.state.status);
      if (r.state.status === 'active') setNotice('Your domain is live — members can reach you there now.');
    });
  }
  function remove() {
    setError(null); setNotice(null);
    startTransition(async () => {
      const r = await removeCommunityDomain(communityId);
      if (!r.ok) { setError(r.error); return; }
      setDomain(''); setStatus(null); setDns(null); setInput('');
    });
  }
  function copyValue(v: string) {
    navigator.clipboard?.writeText(v).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }).catch(() => {/* clipboard unavailable; no-op */});
  }

  return (
    <section style={{ marginTop: 24, borderTop: `1px solid ${HAIRLINE}`, paddingTop: 40 }}>
      <style>{`
        @keyframes gild-spin { to { transform: rotate(360deg); } }
        .gild-spin { animation: gild-spin 0.8s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .gild-spin { animation: none; } }
      `}</style>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Globe size={18} aria-hidden /> Custom domain
      </h2>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px', lineHeight: 1.6 }}>
        Serve your community on your own domain — e.g. <code style={{ fontSize: 12.5, background: SURFACE, padding: '1px 6px', borderRadius: 5 }}>community.yoursite.com</code>. SSL is issued automatically once your DNS points to us.
      </p>

      {!isPro ? (
        // ── Locked: real upgrade path, not a dead end ──────────────────────
        <div style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <Lock size={16} style={{ color: MUTED, flexShrink: 0, marginTop: 2 }} aria-hidden />
            <p style={{ fontSize: 14, color: INK, margin: 0, lineHeight: 1.55 }}>
              Custom domains are a <strong>Pro</strong> feature. Upgrade to put your community on your own
              domain and drop the Gild badge.
            </p>
          </div>
          <Link
            href={`/c/${slug}/billing`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              borderRadius: 8, background: primary, color: '#fff', fontSize: 14, fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Upgrade to Pro <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      ) : !domain ? (
        // ── Empty: teach the one input we need ─────────────────────────────
        <div>
          <label htmlFor="gild-custom-domain" style={labelStyle}>Your domain</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              id="gild-custom-domain"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) connect(); }}
              placeholder="community.yoursite.com"
              autoCapitalize="off" autoCorrect="off" spellCheck={false}
              style={{ ...inputStyle, flex: '1 1 240px' }}
            />
            <button
              type="button"
              onClick={connect}
              disabled={pending || !input.trim()}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none', background: primary,
                color: '#fff', fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
                cursor: pending || !input.trim() ? 'default' : 'pointer',
                opacity: pending || !input.trim() ? 0.6 : 1, whiteSpace: 'nowrap',
              }}
            >
              {pending ? 'Connecting…' : 'Connect domain'}
            </button>
          </div>
        </div>
      ) : (
        // ── Connected: status + DNS instructions / live link ───────────────
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: status !== 'active' && dns ? 20 : 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              {status === 'active' ? (
                <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
                   style={{ fontSize: 15, fontWeight: 700, color: INK, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, wordBreak: 'break-all' }}>
                  {domain} <ExternalLink size={13} aria-hidden style={{ color: MUTED, flexShrink: 0 }} />
                </a>
              ) : (
                <strong style={{ fontSize: 15, color: INK, wordBreak: 'break-all' }}>{domain}</strong>
              )}
              <StatusBadge status={status} />
            </div>
            <button
              type="button" onClick={remove} disabled={pending}
              style={{ background: 'transparent', border: 'none', padding: 0, color: 'oklch(0.45 0.16 25)', fontSize: 13, fontWeight: 600, cursor: pending ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >
              Remove
            </button>
          </div>

          {status !== 'active' && dns && (
            <>
              <p style={{ fontSize: 13, color: MUTED, margin: '0 0 12px', lineHeight: 1.6 }}>
                Add this record at your DNS provider, then verify. It can take a few minutes to a few hours to propagate.
              </p>
              <div style={{ background: SURFACE, border: `1px solid ${HAIRLINE}`, borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '10px 20px', fontSize: 13, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                <span style={{ color: MUTED }}>Type</span><span style={{ color: INK }}>{dns.type}</span>
                <span style={{ color: MUTED }}>Name</span><span style={{ color: INK }}>{dns.name}</span>
                <span style={{ color: MUTED }}>Value</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: INK, wordBreak: 'break-all' }}>
                  {dns.value}
                  <button
                    type="button" onClick={() => copyValue(dns.value)}
                    aria-label={copied ? 'Copied' : 'Copy value'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'oklch(0.50 0.14 150)' : MUTED, padding: 0, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
                  >
                    {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                  </button>
                </span>
              </div>
              <button
                type="button" onClick={verify} disabled={pending}
                style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 8, border: `1px solid ${HAIRLINE}`, background: '#fff', color: INK, fontWeight: 600, fontSize: 14, fontFamily: 'inherit', cursor: pending ? 'default' : 'pointer' }}
              >
                <RefreshCw size={14} aria-hidden className={pending ? 'gild-spin' : undefined} />
                {pending ? 'Checking DNS…' : 'Verify DNS'}
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p role="alert" style={{ marginTop: 16, padding: '10px 14px', background: 'oklch(0.96 0.04 25)', border: '1px solid oklch(0.88 0.08 25)', borderRadius: 8, color: 'oklch(0.40 0.16 25)', fontSize: 13, lineHeight: 1.5 }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" style={{ marginTop: 16, padding: '10px 14px', background: 'oklch(0.96 0.05 150)', border: '1px solid oklch(0.85 0.10 150)', borderRadius: 8, color: 'oklch(0.36 0.14 150)', fontSize: 13, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={14} aria-hidden /> {notice}
        </p>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const base: React.CSSProperties = { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap', letterSpacing: '0.01em' };
  if (status === 'active') return <span style={{ ...base, color: 'oklch(0.36 0.14 150)', background: 'oklch(0.95 0.05 150)' }}>Live</span>;
  if (status === 'pending') return <span style={{ ...base, color: 'oklch(0.45 0.10 75)', background: 'oklch(0.95 0.06 85)' }}>Pending DNS</span>;
  if (status === 'error') return <span style={{ ...base, color: 'oklch(0.45 0.16 25)', background: 'oklch(0.96 0.04 25)' }}>Needs attention</span>;
  return null;
}
