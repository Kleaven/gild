import { GILD_FONTS } from '@/components/gild';

export default function CourseDetailLoading() {
  return (
    <div
      style={{
        fontFamily: GILD_FONTS.sans,
        padding: '32px 28px 60px',
        maxWidth: 920,
        margin: '0 auto',
      }}
    >
      {/* Breadcrumb skeleton */}
      <div
        style={{
          height: 12,
          width: 80,
          borderRadius: 6,
          background: 'oklch(0.92 0.005 250)',
          marginBottom: 20,
          animation: 'gild-pulse 1.5s ease-in-out infinite',
        }}
      />
      {/* Cover skeleton */}
      <div
        style={{
          height: 220,
          borderRadius: 14,
          background: 'oklch(0.92 0.005 250)',
          marginBottom: 24,
          animation: 'gild-pulse 1.5s ease-in-out infinite',
          animationDelay: '0.1s',
        }}
      />
      {/* Title skeleton */}
      <div
        style={{
          height: 44,
          width: '60%',
          borderRadius: 8,
          background: 'oklch(0.92 0.005 250)',
          marginBottom: 12,
          animation: 'gild-pulse 1.5s ease-in-out infinite',
          animationDelay: '0.15s',
        }}
      />
      <div
        style={{
          height: 16,
          width: '80%',
          borderRadius: 6,
          background: 'oklch(0.92 0.005 250)',
          marginBottom: 24,
          animation: 'gild-pulse 1.5s ease-in-out infinite',
          animationDelay: '0.2s',
        }}
      />
      {/* Module skeletons */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            border: '1px solid oklch(0.92 0.01 250)',
            borderRadius: 12,
            marginBottom: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: 52,
              background: 'oklch(0.97 0.002 250)',
              borderBottom: '1px solid oklch(0.95 0.005 250)',
              animation: 'gild-pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.15 + 0.25}s`,
            }}
          />
          {[0, 1, 2].map((j) => (
            <div
              key={j}
              style={{
                height: 44,
                borderTop: j === 0 ? 'none' : '1px solid oklch(0.96 0.005 250)',
                background: '#fff',
                animation: 'gild-pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.15 + j * 0.08 + 0.3}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
