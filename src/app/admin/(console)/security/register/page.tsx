import Link from 'next/link';
import { requirePlatformAdmin } from '@/lib/admin/guards';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';
import AddKeyForm from './AddKeyForm';

export const dynamic = 'force-dynamic';

export default async function RegisterKeyPage() {
  await requirePlatformAdmin();

  return (
    <div style={{ padding: '40px 32px', maxWidth: 640 }}>
      <Link
        href="/admin/security"
        style={{
          display: 'inline-block',
          fontSize: 12,
          color: GILD_ADMIN_TOKENS.text.muted,
          textDecoration: 'none',
          marginBottom: 20,
          fontFamily: GILD_FONTS.mono,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        ← Back to security keys
      </Link>

      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            marginBottom: 8,
            color: GILD_ADMIN_TOKENS.text.primary,
            fontFamily: GILD_FONTS.display,
          }}
        >
          Register a security key
        </h1>
        <p
          style={{
            fontSize: 14,
            color: GILD_ADMIN_TOKENS.text.muted,
            lineHeight: 1.55,
            maxWidth: '60ch',
          }}
        >
          Add another authenticator to your admin account. A second key turns
          the &ldquo;lose one device, lose the console&rdquo; single point of
          failure into a survivable accident. Use a different device or
          hardware key than the one you&rsquo;re currently signed in with.
        </p>
      </header>

      <AddKeyForm />
    </div>
  );
}
