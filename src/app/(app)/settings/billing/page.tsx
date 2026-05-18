import { requireAuth } from '@/lib/auth';
import { GlobalBilling } from '@/components/gild/GlobalBilling';

export default async function GlobalBillingPage() {
  // email lives on the auth user (auth.users), not on the profile row.
  // plan and subscription_status DO live on profiles — no cast needed,
  // the old `(profile as any)` was masking nothing real.
  const { user, profile } = await requireAuth();

  return (
    <GlobalBilling
      user={{
        id: profile.id,
        email: user.email,
        plan: profile.plan,
        subscription_status: profile.subscription_status,
      }}
    />
  );
}
