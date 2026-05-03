import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseServerClient } from '../lib/auth/server';

export default async function RootPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Redirect to first community, or show CTA if none
    const { data: memberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
      .neq('role', 'banned')
      .limit(1);

    const firstMembership = memberships?.[0];
    if (firstMembership) {
      redirect(`/c/${firstMembership.community_id}`);
    }

    return (
      <main style={{ maxWidth: 480, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>Welcome to Gild</h1>
        <p style={{ color: '#666', marginBottom: 32 }}>
          You&apos;re not part of any community yet.
        </p>
        <Link
          href="/communities/new"
          style={{
            display: 'inline-block',
            background: '#000',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Create your first community
        </Link>
      </main>
    );
  }

  // Landing for unauthenticated visitors
  return (
    <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 16px', textAlign: 'center' }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}>Gild</h1>
      <p style={{ fontSize: 20, color: '#555', marginBottom: 40 }}>
        Build your premium community. 0% transaction fees. Forever.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link
          href="/sign-up"
          style={{
            background: '#000',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          Get started free
        </Link>
        <Link
          href="/sign-in"
          style={{
            background: 'transparent',
            color: '#000',
            padding: '12px 28px',
            borderRadius: 8,
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 16,
            border: '1.5px solid #000',
          }}
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
