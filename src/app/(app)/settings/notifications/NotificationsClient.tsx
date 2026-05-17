'use client';

import { useState, useMemo, useTransition } from 'react';
import { setBroadcastOptOut } from '@/app/actions';
import { GILD_FONTS } from '@/components/gild';

type Row = {
  communityId: string;
  name: string;
  slug: string;
  themeHue: number;
  optedOut: boolean;
};

// Search input only meaningfully helps once the list gets long. Below this
// threshold it's just visual clutter.
const SEARCH_THRESHOLD = 6;

export default function NotificationsClient({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [, startTransition] = useTransition();

  const showSearch = initial.length > SEARCH_THRESHOLD;
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q));
  }, [rows, query]);

  function toggle(communityId: string) {
    const row = rows.find((r) => r.communityId === communityId);
    if (!row || busyId) return;

    // Optimistic flip — server reconciles on revalidate.
    const nextOptedOut = !row.optedOut;
    setRows((prev) =>
      prev.map((r) => (r.communityId === communityId ? { ...r, optedOut: nextOptedOut } : r)),
    );
    setBusyId(communityId);
    setError(null);

    startTransition(async () => {
      const res = await setBroadcastOptOut({ communityId, optOut: nextOptedOut });
      if (!res.ok) {
        // Roll back on failure.
        setRows((prev) =>
          prev.map((r) => (r.communityId === communityId ? { ...r, optedOut: !nextOptedOut } : r)),
        );
        setError(res.error || 'Failed to update preference');
      }
      setBusyId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: 'center', background: '#fff', border: '1px solid oklch(0.94 0.005 250)', borderRadius: 12, color: 'oklch(0.45 0.02 250)', fontSize: 14 }}>
        You're not a member of any communities yet.
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, background: 'oklch(0.96 0.04 25)', color: 'oklch(0.40 0.16 25)', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {showSearch && (
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'oklch(0.55 0.02 250)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${initial.length} communities…`}
            aria-label="Filter communities"
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: 10,
              border: '1px solid oklch(0.92 0.01 250)',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              background: '#fff',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {filteredRows.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', background: '#fff', border: '1px solid oklch(0.94 0.005 250)', borderRadius: 12, color: 'oklch(0.45 0.02 250)', fontSize: 14 }}>
          No communities match "{query}".
        </div>
      ) : (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredRows.map((r) => {
          const subscribed = !r.optedOut;
          return (
            <li
              key={r.communityId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                padding: '14px 16px',
                background: '#fff',
                border: '1px solid oklch(0.94 0.005 250)',
                borderRadius: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `oklch(0.92 0.06 ${r.themeHue})`,
                    color: `oklch(0.35 0.16 ${r.themeHue})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: GILD_FONTS.display,
                    fontSize: 15,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {r.name.slice(0, 1).toUpperCase()}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'oklch(0.20 0.02 250)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'oklch(0.50 0.02 250)' }}>
                    {subscribed ? 'Newsletter broadcasts enabled' : 'Unsubscribed from broadcasts'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={subscribed}
                aria-label={`Toggle broadcast emails for ${r.name}`}
                disabled={busyId === r.communityId}
                onClick={() => toggle(r.communityId)}
                style={{
                  position: 'relative',
                  width: 44,
                  height: 26,
                  borderRadius: 13,
                  border: 'none',
                  background: subscribed
                    ? `oklch(0.55 0.16 ${r.themeHue})`
                    : 'oklch(0.88 0.005 250)',
                  cursor: busyId === r.communityId ? 'default' : 'pointer',
                  transition: 'background 0.15s ease',
                  flexShrink: 0,
                  padding: 0,
                  opacity: busyId === r.communityId ? 0.6 : 1,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: subscribed ? 21 : 3,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: '#fff',
                    boxShadow: '0 1px 3px oklch(0 0 0 / 0.2)',
                    transition: 'left 0.15s ease',
                  }}
                />
              </button>
            </li>
          );
        })}
      </ul>
      )}
    </div>
  );
}
