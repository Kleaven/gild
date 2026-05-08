import { GILD_FONTS } from '@/components/gild';

export default function CoursesLoading() {
  return (
    <div
      style={{
        fontFamily: GILD_FONTS.sans,
        padding: '40px 28px 60px',
        maxWidth: 1080,
        margin: '0 auto',
      }}
    >
      {/* Header skeleton */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            height: 40,
            width: '30%',
            borderRadius: 8,
            background: 'oklch(0.92 0.005 250)',
            marginBottom: 12,
            animation: 'gild-pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            height: 14,
            width: '50%',
            borderRadius: 6,
            background: 'oklch(0.92 0.005 250)',
            animation: 'gild-pulse 1.5s ease-in-out infinite',
            animationDelay: '0.1s',
          }}
        />
      </div>
      {/* Card grid skeleton */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              border: '1px solid oklch(0.92 0.01 250)',
              borderRadius: 14,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <div
              style={{
                height: 160,
                background: 'oklch(0.92 0.005 250)',
                animation: 'gild-pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
            <div style={{ padding: '18px 20px 20px' }}>
              <div
                style={{
                  height: 18,
                  width: '70%',
                  borderRadius: 6,
                  background: 'oklch(0.92 0.005 250)',
                  marginBottom: 10,
                  animation: 'gild-pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.15 + 0.1}s`,
                }}
              />
              <div
                style={{
                  height: 12,
                  width: '90%',
                  borderRadius: 6,
                  background: 'oklch(0.92 0.005 250)',
                  animation: 'gild-pulse 1.5s ease-in-out infinite',
                  animationDelay: `${i * 0.15 + 0.2}s`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
