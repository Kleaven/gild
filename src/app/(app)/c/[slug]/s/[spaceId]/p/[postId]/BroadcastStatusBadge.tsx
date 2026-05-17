import type { BroadcastStatus } from '@/lib/feed';

// Server component — read-only summary of newsletter delivery for a single
// post. Rendered only when a broadcast was attempted and the viewer is an
// owner/admin (gated by the parent page).

type Props = { status: BroadcastStatus };

export default function BroadcastStatusBadge({ status }: Props) {
  const { total, pending, sent, failed } = status;
  const delivered = sent;
  const stillGoing = pending > 0;
  const hasFailures = failed > 0;

  // Color semantics:
  //   - In-flight  → neutral blue
  //   - All sent   → green success
  //   - Any failures (and nothing pending) → amber warning
  let tone: { bg: string; border: string; fg: string; icon: 'spin' | 'check' | 'warn' };
  if (stillGoing) {
    tone = {
      bg: 'oklch(0.97 0.02 240)',
      border: 'oklch(0.55 0.10 240 / 0.25)',
      fg: 'oklch(0.35 0.12 240)',
      icon: 'spin',
    };
  } else if (hasFailures) {
    tone = {
      bg: 'oklch(0.96 0.05 60)',
      border: 'oklch(0.55 0.14 60 / 0.30)',
      fg: 'oklch(0.40 0.14 60)',
      icon: 'warn',
    };
  } else {
    tone = {
      bg: 'oklch(0.96 0.05 150)',
      border: 'oklch(0.50 0.14 150 / 0.30)',
      fg: 'oklch(0.36 0.14 150)',
      icon: 'check',
    };
  }

  const headline = stillGoing
    ? `Sending newsletter… ${delivered.toLocaleString()} of ${total.toLocaleString()} delivered`
    : hasFailures
    ? `Newsletter sent · ${delivered.toLocaleString()}/${total.toLocaleString()} delivered`
    : `Newsletter delivered to ${total.toLocaleString()} member${total === 1 ? '' : 's'}`;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        marginTop: 18,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: 10,
        fontSize: 13,
        color: tone.fg,
        lineHeight: 1.5,
      }}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex' }}>
        {tone.icon === 'spin' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        )}
        {tone.icon === 'check' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
        {tone.icon === 'warn' && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontWeight: 600 }}>{headline}</strong>
        {(failed > 0 || pending > 0) && (
          <span style={{ display: 'block', fontSize: 12, opacity: 0.85, marginTop: 2 }}>
            {pending > 0 && `${pending.toLocaleString()} queued`}
            {pending > 0 && failed > 0 && ' · '}
            {failed > 0 && `${failed.toLocaleString()} failed`}
            {failed > 0 && ' (retry from admin console)'}
          </span>
        )}
      </span>
    </div>
  );
}
