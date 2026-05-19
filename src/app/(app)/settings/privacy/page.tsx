import { requireAuth } from '@/lib/auth';
import { GILD_FONTS } from '@/components/gild';
import PrivacyClient from './PrivacyClient';

export const dynamic = 'force-dynamic';

export default async function PrivacySettingsPage() {
  const { profile, user } = await requireAuth();

  return (
    <main
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 56px) clamp(20px, 4vw, 32px) 96px',
        fontFamily: GILD_FONTS.sans,
        color: 'oklch(0.18 0.02 250)',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 28,
            fontWeight: 800,
            margin: '0 0 8px',
            letterSpacing: '-0.02em',
          }}
        >
          Privacy &amp; Data
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'oklch(0.45 0.02 250)', lineHeight: 1.55 }}>
          Export everything Gild stores about you, or permanently delete your account.
          Both controls satisfy your data-subject rights under GDPR (EU/UK), PDPA (SG),
          and equivalent global privacy frameworks.
        </p>
      </header>

      <PrivacyClient
        displayName={profile.display_name}
        email={user.email ?? ''}
      />
    </main>
  );
}
