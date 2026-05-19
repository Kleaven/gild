import { requireAuth } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { listNotifications } from '@/lib/notifications';
import { GILD_FONTS } from '@/components/gild';
import NotificationsInboxClient from './NotificationsInboxClient';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ all?: string }>;
};

export default async function NotificationsPage({ searchParams }: Props) {
  await requireAuth();
  const supabase = await getSupabaseServerClient();
  const sp = await searchParams;
  const showAll = sp.all === '1';

  const notifications = await listNotifications(supabase, { showAll });
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: 'clamp(32px, 5vw, 56px) clamp(20px, 4vw, 32px) 96px',
        fontFamily: GILD_FONTS.sans,
        color: 'oklch(0.18 0.02 250)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 28,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: GILD_FONTS.display,
              fontSize: 28,
              fontWeight: 800,
              margin: '0 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            Notifications
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'oklch(0.50 0.02 250)',
              fontFamily: GILD_FONTS.mono,
              letterSpacing: '0.02em',
            }}
          >
            {unreadCount} unread · {notifications.length} total
            {showAll ? ' · showing all' : ' · showing active'}
          </p>
        </div>
      </header>

      <NotificationsInboxClient
        initialNotifications={notifications}
        showAll={showAll}
      />
    </main>
  );
}
