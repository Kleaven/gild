import { requireAuth } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { GILD_FONTS } from '@/components/gild';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  await requireAuth();
  const supabase = await getSupabaseServerClient();

  // RLS on community_members.SELECT lets a user see their own rows.
  // Inline the community join — we need name + slug + theme_hue to render.
  const { data: memberships } = await supabase
    .from('community_members')
    .select(`
      community_id,
      broadcast_opt_out,
      role,
      community:communities!inner ( name, slug, theme_hue )
    `)
    .neq('role', 'banned')
    .order('joined_at', { ascending: true });

  const rows = (memberships ?? [])
    .map((m: any) => ({
      communityId: m.community_id as string,
      name: (m.community?.name as string) || 'Untitled',
      slug: (m.community?.slug as string) || '',
      themeHue: (m.community?.theme_hue as number | null) ?? 250,
      optedOut: Boolean(m.broadcast_opt_out),
    }));

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px', fontFamily: GILD_FONTS.sans }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: GILD_FONTS.display, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px' }}>
          Notifications
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: 'oklch(0.45 0.02 250)', lineHeight: 1.5 }}>
          Choose which communities can email you newsletter broadcasts. Transactional emails (billing, account changes) are always sent.
        </p>
      </header>

      <NotificationsClient initial={rows} />
    </main>
  );
}
