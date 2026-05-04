import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import CommunityForm from './CommunityForm';

// Server component — checks for an existing owner community before rendering the form.
// If the user already created a community (and lost their place), redirect them forward.
export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user already owns a community from a previous attempt
    const { data: memberships } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .limit(1);

    const existing = memberships?.[0];
    if (existing) {
      // Resume from the plan step — they already have a community
      redirect(`/onboarding/${existing.community_id}/plan`);
    }
  }

  return (
    <>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, textAlign: 'center' }}>
        Create your community
      </h1>
      <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 28 }}>
        Step 1 of 7 — Let&apos;s start with the basics.
      </p>
      <CommunityForm />
    </>
  );
}
