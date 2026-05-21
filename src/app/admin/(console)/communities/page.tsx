import { requirePlatformAdmin } from '@/lib/admin/guards';
import { getAdminCommunities } from '@/lib/admin';
import type { AdminCommunityRow } from '@/lib/admin';
import { GILD_ADMIN_TOKENS, GILD_FONTS } from '@/components/gild/styles';
import AdminSearch from './AdminSearch';

type Props = { searchParams: Promise<{ q?: string }> };

const STATUS_COLOR: Record<string, string> = {
  active: GILD_ADMIN_TOKENS.accent.successText,
  trialing: GILD_ADMIN_TOKENS.accent.info,
  past_due: GILD_ADMIN_TOKENS.accent.warning,
  canceled: GILD_ADMIN_TOKENS.text.subtle,
};

function PlanBadge({ plan }: { plan: string }) {
  const isPro = plan === 'pro';
  return (
    <span
      style={{
        display: 'inline-flex',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'capitalize',
        fontFamily: GILD_FONTS.mono,
        background: isPro ? GILD_ADMIN_TOKENS.status.proBg : GILD_ADMIN_TOKENS.bg.raised,
        color: isPro ? GILD_ADMIN_TOKENS.status.proText : GILD_ADMIN_TOKENS.text.secondary,
      }}
    >
      {plan}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const color = status ? (STATUS_COLOR[status] ?? GILD_ADMIN_TOKENS.text.muted) : GILD_ADMIN_TOKENS.text.muted;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'capitalize',
        color,
        fontFamily: GILD_FONTS.mono,
      }}
    >
      {status ? status.replace('_', ' ') : '—'}
    </span>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontFamily: GILD_FONTS.mono,
  fontWeight: 500,
  color: GILD_ADMIN_TOKENS.text.subtle,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: GILD_ADMIN_TOKENS.text.muted,
  fontSize: 14,
};

export default async function AdminCommunitiesPage({ searchParams }: Props) {
  await requirePlatformAdmin();
  const { q } = await searchParams;
  const communities: AdminCommunityRow[] = await getAdminCommunities(q ?? null);

  return (
    <div style={{ padding: 32, maxWidth: 1280, margin: '0 auto' }}>
      <style>{`
        .gild-admin-row { border-bottom: 1px solid ${GILD_ADMIN_TOKENS.border.subtle}; transition: background-color 150ms ease; }
        .gild-admin-row:hover { background: ${GILD_ADMIN_TOKENS.bg.surfaceFaint}; }
      `}</style>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 4,
          fontFamily: GILD_FONTS.display,
          color: GILD_ADMIN_TOKENS.text.primary,
        }}
      >
        Communities
      </h1>
      <p style={{ color: GILD_ADMIN_TOKENS.text.muted, fontSize: 14, marginBottom: 24, fontFamily: GILD_FONTS.mono }}>
        {communities.length} communities
      </p>

      <AdminSearch defaultValue={q ?? ''} />

      <div
        style={{
          marginTop: 24,
          borderRadius: 12,
          border: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${GILD_ADMIN_TOKENS.border.default}`,
                background: GILD_ADMIN_TOKENS.bg.surfaceSoft,
              }}
            >
              <th style={thStyle}>Community</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Plan</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Members</th>
              <th style={thStyle}>Created</th>
            </tr>
          </thead>
          <tbody>
            {communities.map((c) => (
              <tr key={c.id} className="gild-admin-row">
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 500, color: GILD_ADMIN_TOKENS.text.primary }}>
                    {c.name}
                  </div>
                  <div style={{ color: GILD_ADMIN_TOKENS.text.subtle, fontSize: 12, fontFamily: GILD_FONTS.mono }}>
                    {c.slug}
                  </div>
                </td>
                <td style={tdStyle}>{c.ownerEmail ?? '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <PlanBadge plan={c.plan} />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusBadge status={c.subscriptionStatus} />
                </td>
                <td style={{ ...tdStyle, fontFamily: GILD_FONTS.mono }}>{c.memberCount}</td>
                <td style={{ ...tdStyle, fontFamily: GILD_FONTS.mono }}>
                  {new Date(c.createdAt).toLocaleDateString('en-SG', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {communities.length === 0 && (
          <div
            style={{
              padding: '48px 16px',
              textAlign: 'center',
              color: GILD_ADMIN_TOKENS.text.subtle,
              fontSize: 14,
            }}
          >
            No communities found.
          </div>
        )}
      </div>
    </div>
  );
}
