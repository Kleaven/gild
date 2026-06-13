import { notFound, redirect } from 'next/navigation';
import { getCommunityContextBySlug } from '../../../../lib/community/context';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { confirmJoinCheckout } from '@/lib/billing/subscription';

const SLUG_RE = /^[a-z0-9-]{3,50}$/;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ payment?: string; session_id?: string }>;
};

export default async function CommunityHomePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { payment, session_id: checkoutSessionId } = await searchParams;

  if (!SLUG_RE.test(slug)) {
    notFound();
  }

  const { community, spaces } = await getCommunityContextBySlug(slug);

  if (!community) {
    notFound();
  }

  // Returning from a paid-join Checkout → grant membership immediately,
  // before the layout's join gate evaluates. Webhook remains the backstop.
  if (payment === 'success' && checkoutSessionId) {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        await confirmJoinCheckout(community.id, checkoutSessionId, user.id);
      } catch {
        // non-fatal — webhook will grant
      }
    }
  }

  const firstSpace = spaces.find((s) => s.deleted_at === null);

  if (firstSpace) {
    redirect(`/c/${slug}/s/${firstSpace.id}`);
  }

  return (
    <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
      <h2 style={{ fontSize: 20, fontWeight: 600 }}>{community.name}</h2>
      <p>No spaces yet. Create one to get started.</p>
    </div>
  );
}
