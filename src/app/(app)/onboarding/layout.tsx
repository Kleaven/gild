import OnboardingProgress from './OnboardingProgress';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 48,
        paddingBottom: 80,
      }}
    >
      <div style={{ width: '100%', maxWidth: 560, padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px' }}>Gild</span>
        </div>
        <OnboardingProgress />
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '40px 40px',
            boxShadow: '0 1px 12px rgba(0,0,0,0.07)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
