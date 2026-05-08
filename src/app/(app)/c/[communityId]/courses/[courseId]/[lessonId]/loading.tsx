import { GILD_FONTS } from '@/components/gild';

export default function LessonLoading() {
  return (
    <div
      style={{
        fontFamily: GILD_FONTS.sans,
        padding: '32px 28px 60px',
        maxWidth: 820,
        margin: '0 auto',
      }}
    >
      {/* Breadcrumb */}
      <div
        style={{
          height: 12,
          width: 100,
          borderRadius: 6,
          background: 'oklch(0.92 0.005 250)',
          marginBottom: 20,
          animation: 'gild-pulse 1.5s ease-in-out infinite',
        }}
      />
      {/* Title */}
      <div
        style={{
          height: 36,
          width: '70%',
          borderRadius: 8,
          background: 'oklch(0.92 0.005 250)',
          marginBottom: 24,
          animation: 'gild-pulse 1.5s ease-in-out infinite',
          animationDelay: '0.1s',
        }}
      />
      {/* Video placeholder */}
      <div
        style={{
          width: '100%',
          paddingBottom: '56.25%',
          position: 'relative',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'oklch(0.92 0.005 250)',
            animation: 'gild-pulse 1.5s ease-in-out infinite',
            animationDelay: '0.15s',
          }}
        />
      </div>
      {/* Body lines */}
      {[90, 80, 70, 85, 60].map((w, i) => (
        <div
          key={i}
          style={{
            height: 14,
            width: `${w}%`,
            borderRadius: 6,
            background: 'oklch(0.92 0.005 250)',
            marginBottom: 12,
            animation: 'gild-pulse 1.5s ease-in-out infinite',
            animationDelay: `${i * 0.08 + 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}
