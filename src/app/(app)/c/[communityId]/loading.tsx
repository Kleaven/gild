import { GILD_FONTS } from '@/components/gild';

export default function CommunityLoading() {
  return (
    <div
      style={{
        fontFamily: GILD_FONTS.sans,
        display: 'flex',
        minHeight: 'calc(100vh - 49px)',
      }}
    >
      {/* Sidebar skeleton */}
      <div
        style={{
          width: 240,
          flexShrink: 0,
          background: 'oklch(0.985 0.003 250)',
          borderRight: '1px solid oklch(0.94 0.005 250)',
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {[80, 60, 60, 40, 60].map((w, i) => (
          <div
            key={i}
            style={{
              height: 12,
              borderRadius: 6,
              width: `${w}%`,
              background: 'oklch(0.92 0.005 250)',
              animation: 'gild-pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
      {/* Content skeleton */}
      <div style={{ flex: 1, padding: '40px 28px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {[60, 40, 90, 70, 50].map((w, i) => (
            <div
              key={i}
              style={{
                height: i === 0 ? 32 : 14,
                borderRadius: 6,
                width: `${w}%`,
                background: 'oklch(0.92 0.005 250)',
                marginBottom: 16,
                animation: 'gild-pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
