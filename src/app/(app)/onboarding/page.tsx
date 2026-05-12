import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import CommunityForm from './CommunityForm';
import { OnboardingClient } from './OnboardingClient';

export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/sign-in');

  const { data: profile } = await supabase
    .from('profiles')
    .select('persona, interests, occupation')
    .eq('id', user.id)
    .maybeSingle();

  // 1. If no persona chosen, show the picker
  if (!profile?.persona) {
    return <OnboardingClient step="persona" />;
  }

  // 2. If Member, check if KYC is done
  if (profile.persona === 'member') {
    if (!profile.interests || profile.interests.length === 0) {
      return <OnboardingClient step="member_kyc" />;
    }
    // Member is fully onboarded
    redirect('/communities');
  }

  // 3. If Owner, proceed with community creation
  // Check if user already owns a community from a previous attempt
  const { data: memberships } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .limit(1);

  const existing = memberships?.[0];
  if (existing) {
    redirect(`/onboarding/${existing.community_id}/plan`);
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
