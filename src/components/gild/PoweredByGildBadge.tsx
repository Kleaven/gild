import Link from 'next/link';

// Subtle "Powered by Gild" badge shown on Free communities' member-facing
// pages. Pro communities hide it (see canRemoveGildBadge). Fixed bottom-right,
// out of the way of content, links to the Gild landing page.
export default function PoweredByGildBadge() {
  return (
    <Link
      href="/"
      aria-label="Powered by Gild"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 50,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 12px',
        borderRadius: 999,
        background: 'oklch(1 0 0 / 0.92)',
        border: '1px solid oklch(0.90 0.01 250)',
        boxShadow: '0 6px 20px -8px oklch(0.20 0.02 250 / 0.25)',
        backdropFilter: 'saturate(1.2) blur(6px)',
        fontSize: 12,
        fontWeight: 500,
        color: 'oklch(0.45 0.02 250)',
        textDecoration: 'none',
        lineHeight: 1,
      }}
    >
      <span
        aria-hidden
        style={{
          width: 16,
          height: 16,
          borderRadius: 5,
          background: 'oklch(0.20 0.02 250)',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 800,
        }}
      >
        G
      </span>
      Powered by <strong style={{ fontWeight: 700, color: 'oklch(0.25 0.02 250)' }}>Gild</strong>
    </Link>
  );
}
