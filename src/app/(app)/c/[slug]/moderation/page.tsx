import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { getCommunityReports } from '@/lib/moderation';
import { GILD_FONTS } from '@/components/gild';
import ModerationQueueClient from './ModerationQueueClient';

const SLUG_RE = /^[a-z0-9-]{3,50}$/;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function ModerationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!SLUG_RE.test(slug)) notFound();

  const supabase = await getSupabaseServerClient();
  const { community, membership } = await getCommunityContextBySlug(slug);
  if (!community) notFound();

  // Page is admin+ only. Page-level gate; reports.SELECT RLS additionally
  // enforces this on every read.
  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    notFound();
  }

  // Status filter: pending (default), resolved_removed, resolved_dismissed, all
  const validStatuses = ['pending', 'resolved_removed', 'resolved_dismissed', 'all'] as const;
  const status = (validStatuses as readonly string[]).includes(sp.status ?? '')
    ? (sp.status as (typeof validStatuses)[number])
    : 'pending';

  const reports = await getCommunityReports(supabase, community.id, {
    status: status === 'all' ? 'all' : status,
  });

  // Counts for the tab bar — quick aggregate across the (default-100-row)
  // returned set. If a community has more than 100 reports of one kind a
  // future commit can swap in a server-side COUNT.
  const allReports = await getCommunityReports(supabase, community.id, { status: 'all' });
  const counts = {
    pending: allReports.filter((r) => r.status === 'pending').length,
    resolved_removed: allReports.filter((r) => r.status === 'resolved_removed').length,
    resolved_dismissed: allReports.filter((r) => r.status === 'resolved_dismissed').length,
    all: allReports.length,
  };

  return (
    <main
      style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 56px) clamp(20px, 4vw, 32px) 96px',
        fontFamily: GILD_FONTS.sans,
        color: 'oklch(0.18 0.02 250)',
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontFamily: GILD_FONTS.display,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}
        >
          Moderation
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'oklch(0.50 0.02 250)' }}>
          Member-filed reports for <strong>{community.name}</strong>. Resolve each by removing
          the reported content (off-page, then mark removed here) or dismissing the report.
        </p>
      </header>

      <ModerationQueueClient
        initialReports={reports}
        currentStatus={status}
        counts={counts}
        communitySlug={slug}
      />
    </main>
  );
}
