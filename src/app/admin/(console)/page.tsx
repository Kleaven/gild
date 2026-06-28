import { requirePlatformAdmin } from '@/lib/admin/guards';
import { getAdminStats } from '@/lib/admin';
import type { AdminStats } from '@/lib/admin';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';

type StatCardProps = { label: string; value: number };

function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      style={{
        background: GILD_ADMIN_TOKENS.bg.surface,
        border: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }}
    >
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: GILD_ADMIN_TOKENS.text.primary,
          fontFamily: GILD_FONTS.mono,
          lineHeight: 1.1,
        }}
      >
        {value.toLocaleString()}
      </div>
      <div
        style={{
          fontSize: 11,
          color: GILD_ADMIN_TOKENS.text.subtle,
          marginTop: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: GILD_FONTS.mono,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default async function AdminOverviewPage() {
  await requirePlatformAdmin();
  const stats: AdminStats = await getAdminStats();

  return (
    <div style={{ padding: 32, maxWidth: 1024, margin: '0 auto' }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 4,
          fontFamily: GILD_FONTS.display,
          color: GILD_ADMIN_TOKENS.text.primary,
        }}
      >
        Overview
      </h1>
      <p
        style={{
          color: GILD_ADMIN_TOKENS.text.muted,
          fontSize: 14,
          marginBottom: 40,
        }}
      >
        Platform operational metrics
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 40,
        }}
      >
        <StatCard label="Total Communities" value={stats.totalCommunities} />
        <StatCard label="Total Users"        value={stats.totalUsers} />
        <StatCard label="Free"               value={stats.freeCount} />
        <StatCard label="Pro"                value={stats.proCount} />
        <StatCard label="Trialing"           value={stats.trialingCount} />
        <StatCard label="Active"             value={stats.activeCount} />
        <StatCard label="Past Due"           value={stats.pastDueCount} />
      </div>
    </div>
  );
}
