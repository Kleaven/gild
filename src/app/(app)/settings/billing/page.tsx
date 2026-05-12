import { requireAuth } from '@/lib/auth';
import { GlobalBilling } from '@/components/gild/GlobalBilling';

export default async function GlobalBillingPage() {
  const { profile } = await requireAuth();

  return (
    <GlobalBilling
      user={{
        id: profile.id,
        email: profile.email,
        plan: (profile as any).plan,
        subscription_status: (profile as any).subscription_status,
      }}
    />
  );
}
