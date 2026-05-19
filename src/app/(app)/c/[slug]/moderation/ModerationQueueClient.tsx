'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Flag, Check, X, ShieldCheck, MessageSquare, FileText } from 'lucide-react';
import { GILD_FONTS } from '@/components/gild';
import { resolveReport } from '@/app/actions';
import type { ReportWithReporter } from '@/lib/moderation';

type StatusFilter = 'pending' | 'resolved_removed' | 'resolved_dismissed' | 'all';

type Props = {
  initialReports: ReportWithReporter[];
  currentStatus: StatusFilter;
  counts: Record<StatusFilter, number>;
  communitySlug: string;
};

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'resolved_removed', label: 'Removed' },
  { value: 'resolved_dismissed', label: 'Dismissed' },
  { value: 'all', label: 'All' },
];

function relativeTime(iso: string): string {
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

export default function ModerationQueueClient({ initialReports, currentStatus, counts, communitySlug }: Props) {
  const [reports, setReports] = useState(initialReports);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleResolve(reportId: string, status: 'resolved_removed' | 'resolved_dismissed') {
    const snapshot = reports;
    // Optimistic — drop the row from pending view immediately; if we're on
    // an "all" view, mark it resolved with a timestamp instead.
    if (currentStatus === 'pending') {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } else {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status, resolved_at: new Date().toISOString() }
            : r,
        ),
      );
    }
    setBusyId(reportId);
    setError(null);

    startTransition(async () => {
      const res = await resolveReport({ reportId, status });
      if (!res.ok) {
        setReports(snapshot);
        setError(res.message);
      }
      setBusyId(null);
    });
  }

  if (initialReports.length === 0) {
    return (
      <>
        <TabBar currentStatus={currentStatus} counts={counts} communitySlug={communitySlug} />
        <div
          style={{
            border: '1px solid oklch(0.93 0.005 250)',
            borderRadius: 16,
            padding: '64px 24px',
            background: '#fff',
            textAlign: 'center',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'oklch(0.96 0.05 150)',
              color: 'oklch(0.36 0.14 150)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <ShieldCheck size={26} />
          </div>
          <h2
            style={{
              margin: '0 0 6px',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: GILD_FONTS.display,
              letterSpacing: '-0.01em',
            }}
          >
            {currentStatus === 'pending' ? 'No pending reports' : 'Nothing in this view'}
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'oklch(0.50 0.02 250)' }}>
            {currentStatus === 'pending'
              ? 'Member-filed reports will appear here for review.'
              : 'Try a different status filter.'}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <TabBar currentStatus={currentStatus} counts={counts} communitySlug={communitySlug} />

      {error && (
        <p
          role="alert"
          style={{
            margin: '0 0 14px',
            padding: '10px 14px',
            borderRadius: 8,
            background: 'oklch(0.96 0.04 25)',
            border: '1px solid oklch(0.88 0.08 25)',
            color: 'oklch(0.40 0.16 25)',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          {error}
        </p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {reports.map((r) => {
          const isResolved = r.status !== 'pending';
          return (
            <li
              key={r.id}
              style={{
                border: `1px solid ${isResolved ? 'oklch(0.95 0.005 250)' : 'oklch(0.92 0.05 25)'}`,
                borderRadius: 12,
                padding: '14px 16px',
                background: '#fff',
                opacity: busyId === r.id ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: isResolved ? 'oklch(0.96 0.005 250)' : 'oklch(0.96 0.05 25)',
                    color: isResolved ? 'oklch(0.45 0.02 250)' : 'oklch(0.45 0.16 25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {r.target_type === 'comment' ? <MessageSquare size={16} /> : <FileText size={16} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        background: isResolved ? 'oklch(0.96 0.005 250)' : 'oklch(0.94 0.08 25)',
                        color: isResolved ? 'oklch(0.45 0.02 250)' : 'oklch(0.40 0.16 25)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontFamily: GILD_FONTS.mono,
                      }}
                    >
                      {r.status === 'pending' ? 'Pending' : r.status === 'resolved_removed' ? 'Removed' : 'Dismissed'}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color: 'oklch(0.50 0.02 250)',
                        fontFamily: GILD_FONTS.mono,
                        letterSpacing: '0.02em',
                      }}
                    >
                      {r.target_type} · {relativeTime(r.created_at)}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: 14,
                      color: 'oklch(0.22 0.02 250)',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {r.reason}
                  </p>

                  <div
                    style={{
                      marginTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      flexWrap: 'wrap',
                      fontSize: 12,
                      color: 'oklch(0.55 0.02 250)',
                    }}
                  >
                    <span>
                      Reported by{' '}
                      <strong style={{ color: 'oklch(0.35 0.02 250)' }}>
                        {r.reporter?.display_name ?? 'Deleted user'}
                      </strong>
                      {r.reporter?.username ? ` · @${r.reporter.username}` : ''}
                    </span>
                    <span
                      style={{
                        fontFamily: GILD_FONTS.mono,
                        fontSize: 11,
                        color: 'oklch(0.55 0.02 250)',
                      }}
                    >
                      target:{r.target_id.slice(0, 8)}…
                    </span>
                  </div>
                </div>

                {!isResolved && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => handleResolve(r.id, 'resolved_removed')}
                      disabled={busyId === r.id}
                      title="Content removed — mark resolved"
                      style={{ ...iconBtn, color: 'oklch(0.45 0.16 25)', borderColor: 'oklch(0.88 0.08 25)' }}
                    >
                      <Flag size={14} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Removed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResolve(r.id, 'resolved_dismissed')}
                      disabled={busyId === r.id}
                      title="Dismiss as unfounded"
                      style={{ ...iconBtn, color: 'oklch(0.35 0.02 250)' }}
                    >
                      <X size={14} />
                      <span style={{ fontSize: 12, fontWeight: 600 }}>Dismiss</span>
                    </button>
                  </div>
                )}

                {isResolved && r.resolved_at && (
                  <span
                    style={{
                      flexShrink: 0,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      color: 'oklch(0.55 0.02 250)',
                      fontFamily: GILD_FONTS.mono,
                      letterSpacing: '0.02em',
                    }}
                  >
                    <Check size={12} />
                    {relativeTime(r.resolved_at)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function TabBar({
  currentStatus,
  counts,
  communitySlug,
}: {
  currentStatus: StatusFilter;
  counts: Record<StatusFilter, number>;
  communitySlug: string;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 8,
        marginBottom: 18,
        overflowX: 'auto',
        paddingBottom: 8,
        borderBottom: '1px solid oklch(0.94 0.005 250)',
      }}
    >
      {STATUS_TABS.map((t) => {
        const active = currentStatus === t.value;
        return (
          <Link
            key={t.value}
            role="tab"
            aria-selected={active}
            href={`/c/${communitySlug}/moderation${t.value === 'pending' ? '' : `?status=${t.value}`}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              background: active ? 'oklch(0.20 0.02 250)' : 'transparent',
              color: active ? '#fff' : 'oklch(0.35 0.02 250)',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {t.label}
            <span
              style={{
                fontFamily: GILD_FONTS.mono,
                fontSize: 11,
                fontWeight: 700,
                color: active ? 'rgba(255,255,255,0.75)' : 'oklch(0.55 0.02 250)',
              }}
            >
              {counts[t.value]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 12px',
  borderRadius: 8,
  background: '#fff',
  border: '1px solid oklch(0.92 0.01 250)',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
