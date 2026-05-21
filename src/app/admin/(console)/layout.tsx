import { requirePlatformAdmin } from '@/lib/admin/guards';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';
import AdminNavLink from './AdminNavLink';

type Props = { children: React.ReactNode };

export default async function AdminConsoleLayout({ children }: Props) {
  await requirePlatformAdmin();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        background: GILD_ADMIN_TOKENS.bg.canvas,
        color: GILD_ADMIN_TOKENS.text.body,
        fontFamily: GILD_FONTS.sans,
      }}
    >
      <aside
        style={{
          width: 224,
          flexShrink: 0,
          borderRight: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
          display: 'flex',
          flexDirection: 'column',
          padding: '32px 16px',
          gap: 4,
        }}
      >
        <div style={{ padding: '0 12px', marginBottom: 32 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              fontFamily: GILD_FONTS.display,
              color: GILD_ADMIN_TOKENS.text.primary,
            }}
          >
            Gild
          </span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              color: GILD_ADMIN_TOKENS.text.subtle,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              fontFamily: GILD_FONTS.mono,
            }}
          >
            Admin
          </span>
        </div>
        <AdminNavLink href="/admin" label="Overview" />
        <AdminNavLink href="/admin/communities" label="Communities" />
        <AdminNavLink href="/admin/flags" label="Feature Flags" />
        <AdminNavLink href="/admin/security" label="Security" />
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
