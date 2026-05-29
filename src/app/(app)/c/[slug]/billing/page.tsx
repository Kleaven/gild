import { notFound } from 'next/navigation';
import { getCommunityContextBySlug } from '@/lib/community/context';
import { PLANS, type PlanConfig } from '@/lib/billing';
import { GILD_FONTS } from '@/components/gild';
import PlanSelector from '@/app/(app)/onboarding/[communityId]/plan/PlanSelector';
import { CreditCard, Check, Crown } from 'lucide-react';

type Props = { params: Promise<{ slug: string }> };

export default async function BillingPage({ params }: Props) {
  const { slug } = await params;

  const { community, membership } = await getCommunityContextBySlug(slug);
  if (!community) notFound();

  const communityId = community.id;

  // Only owners/admins can see billing
  if (membership?.role !== 'owner' && membership?.role !== 'admin') {
    notFound();
  }

  const currentPlanId = community.plan || 'free';
  const status = community.subscription_status || 'none';

  return (
    <div style={{
      fontFamily: GILD_FONTS.sans,
      padding: '40px 28px 64px',
      maxWidth: 900,
      margin: '0 auto',
      color: '#111',
    }}>
      {/* Header */}
      <header style={{ marginBottom: 48 }}>
        <h1 style={{ 
          fontFamily: GILD_FONTS.display, 
          fontSize: 36, 
          fontWeight: 900, 
          letterSpacing: '-0.04em', 
          margin: '0 0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          Billing & Subscription
        </h1>
        <p style={{ color: 'oklch(0.50 0.02 250)', fontSize: 16 }}>
          Manage your community's growth and financial settings.
        </p>
      </header>

      {/* Current Plan Card */}
      <section style={{
        background: '#fff',
        border: '1px solid oklch(0.92 0.01 250)',
        borderRadius: 24,
        padding: 32,
        marginBottom: 48,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 24px -1px rgba(0,0,0,0.02)',
      }}>
        <div>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            background: 'oklch(0.96 0.01 250)', 
            padding: '4px 10px', 
            borderRadius: 100, 
            fontSize: 12, 
            fontWeight: 700, 
            color: 'oklch(0.40 0.02 250)',
            marginBottom: 16,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            <Crown size={14} />
            Current Status: {status.toUpperCase()}
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: GILD_FONTS.display }}>
            {currentPlanId === 'pro' ? 'Gild Pro' : currentPlanId === 'hobby' ? 'Gild Hobby' : 'Gild Free'}
          </h2>
          <p style={{ margin: '4px 0 0', color: 'oklch(0.50 0.02 250)', fontSize: 15 }}>
            Your community is currently on the {currentPlanId} plan.
          </p>
        </div>
        <button style={{
          background: '#111',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: 14,
          fontSize: 14,
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <CreditCard size={18} />
          Payment Methods
        </button>
      </section>

      {/* Upgrade Options */}
      <h2 style={{ fontFamily: GILD_FONTS.display, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 24 }}>
        Available Plans
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {(Object.values(PLANS) as PlanConfig[]).map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <div key={plan.id} style={{
              border: isCurrent ? '2px solid #111' : '1px solid oklch(0.92 0.01 250)',
              borderRadius: 20,
              padding: 32,
              background: '#fff',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {isCurrent && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: 24,
                  background: '#111',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: 100,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}>
                  Current Plan
                </div>
              )}
              <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 800, fontFamily: GILD_FONTS.display }}>{plan.name}</h3>
              <p style={{ margin: '0 0 24px', fontSize: 32, fontWeight: 800, fontFamily: GILD_FONTS.display }}>
                ${plan.monthlyUsd}<span style={{ fontSize: 16, fontWeight: 400, color: 'oklch(0.50 0.02 250)' }}>/mo</span>
              </p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1 }}>
                {plan.features.map((feat: string) => (
                  <li key={feat} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'oklch(0.40 0.02 250)', marginBottom: 12, alignItems: 'center' }}>
                    <Check size={16} color="oklch(0.60 0.15 150)" />
                    {feat}
                  </li>
                ))}
              </ul>

              <PlanSelector 
                communityId={communityId} 
                plan={plan.id as any} 
                label={isCurrent ? 'Plan Active' : 'Switch to ' + plan.name}
                returnContext="billing"
                disabled={isCurrent}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
