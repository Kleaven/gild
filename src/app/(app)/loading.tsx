// Route-level loading UI for the authenticated app shell. Without this, slow
// RSC fetches leave the previous page frozen with zero feedback — the single
// biggest "is it broken?" moment in the app.
export default function AppLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <span
        className="gild-loading-dot"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background: 'oklch(0.20 0.02 250)',
          display: 'inline-block',
        }}
      />
      <span style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', fontWeight: 500 }}>Loading…</span>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .gild-loading-dot { animation: gildLoadingPulse 1.1s ease-in-out infinite; }
          @keyframes gildLoadingPulse {
            0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
            50% { transform: scale(0.82) rotate(8deg); opacity: 0.65; }
          }
        }
      `}</style>
    </div>
  );
}
