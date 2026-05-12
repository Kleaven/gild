import { notFound } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/auth/server';
import { getCommunity } from '@/lib/community';
import { getCommunityContext } from '@/lib/community/context';
import { PLANS } from '@/lib/billing';
import { GILD_FONTS, LivePill } from '@/components/gild';
import PlanSelector from '@/app/(app)/onboarding/[communityId]/plan/PlanSelector';
import { CreditCard, Check, Zap, Crown } from 'lucide-react';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ communityId: string }> };

export default async function BillingPage({ params }: Props) {
  const { communityId } = await params;
  if (!UUID_RE.test(communityId)) notFound();

  const supabase = await getSupabaseServerClient();
  const { community, membership } = await getCommunityContext(communityId);
  if (!community) notFound();

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
      <header style={{ marginBottom: 40 }}>
        <h1 style={{ 
          fontFamily: GILD_FONTS.display, 
          fontSize: 32, 
          fontWeight: 800, 
          letterSpacing: '-0.03em', 
          margin: '0 0 8px' 
        }}>
          Billing & Subscription
        </h1>
        <p style={{ fontSize: 16, color: 'oklch(0.50 0.02 250)', margin: 0 }}>
          Manage your community's plan, billing cycles, and growth features.
        </p>
      </header>

      {/* Current Plan Summary */}
      <section style={{
        background: 'oklch(0.985 0.003 250)',
        border: '1px solid oklch(0.94 0.005 250)',
        borderRadius: 20,
        padding: 32,
        marginBottom: 48,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#111',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {currentPlanId === 'pro' ? <Crown size={20} /> : <Zap size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'oklch(0.40 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Current Plan
              </h3>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: GILD_FONTS.display, letterSpacing: '-0.02em' }}>
                {currentPlanId === 'pro' ? 'Pro Architect' : 'Hobbyist'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ 
              fontSize: 13, 
              padding: '4px 10px', 
              borderRadius: 6, 
              background: status === 'active' ? 'oklch(0.92 0.16 150)' : 'oklch(0.95 0.005 250)',
              color: status === 'active' ? 'oklch(0.30 0.16 150)' : 'oklch(0.40 0.02 250)',
              fontWeight: 700,
              textTransform: 'capitalize'
            }}>
              {status}
            </span>
            <p style={{ fontSize: 14, color: 'oklch(0.50 0.02 250)', margin: 0 }}>
              {status === 'active' ? 'Your next billing cycle starts in 14 days.' : 'Upgrade to unlock full growth potential.'}
            </p>
          </div>
        </div>
        <button className="gild-btn" style={{
          padding: '12px 24px',
          borderRadius: 12,
          background: '#fff',
          border: '1px solid oklch(0.85 0.01 250)',
          fontSize: 14,
          fontWeight: 700,
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
        {Object.values(PLANS).map((plan) => {
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
                {plan.features.map(feat => (
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
