'use client';

// Route-level error boundary for the authenticated app. Users never see a
// React digest or stack — one calm sentence, a retry, and a way home.
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 24,
        textAlign: 'center',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ fontSize: 34 }} aria-hidden>
        🫧
      </span>
      <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: '#111' }}>
        Something went sideways.
      </h1>
      <p style={{ fontSize: 14.5, color: 'oklch(0.50 0.02 250)', margin: '0 0 14px', maxWidth: 380, lineHeight: 1.6 }}>
        It’s us, not you. Try again — if it keeps happening, it’s already on our radar.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={reset}
          style={{
            padding: '11px 22px',
            borderRadius: 12,
            background: '#111',
            color: '#fff',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Try again
        </button>
        <a
          href="/communities"
          style={{
            padding: '11px 22px',
            borderRadius: 12,
            border: '1px solid oklch(0.88 0.01 250)',
            color: '#111',
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Back to communities
        </a>
      </div>
    </div>
  );
}
