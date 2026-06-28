'use client';

import React, { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCheckoutSession, createBillingPortalSession, cancelSubscription } from '@/app/actions/billing';
import { GILD_FONTS } from './styles';
import { ConfirmModal } from './ConfirmModal';
import {
  CreditCard,
  Zap,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import type { Plan } from '@/lib/billing/plans';

interface Props {
  user: {
    id: string;
    email?: string;
    plan: string | null;
    subscription_status: string;
  };
}

export function GlobalBilling({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isActive = user.subscription_status === 'active' || user.subscription_status === 'trialing';

  async function handlePlanAction(plan: Plan) {
    setError(null);
    startTransition(async () => {
      try {
        const { url } = await createCheckoutSession(user.id, plan, 'platform', 'global');
        router.push(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process subscription');
      }
    });
  }

  async function handlePortal() {
    startTransition(async () => {
      try {
        const { url } = await createBillingPortalSession(user.id, 'platform', 'global');
        router.push(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      }
    });
  }

  function handleCancel() {
    setError(null);
    setCancelSuccess(false);
    startTransition(async () => {
      try {
        await cancelSubscription(user.id, 'platform');
        setCancelSuccess(true);
        // Refresh server props so subscription_status updates to 'canceled'.
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
      }
    });
  }

  return (
    <div style={{ fontFamily: GILD_FONTS.sans, maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <header style={{ marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px' }}>Billing & Subscription</h1>
        <p style={{ color: 'oklch(0.55 0.02 250)', margin: 0, fontSize: 16 }}>
          Manage your platform-level subscription and community creation limits.
        </p>
      </header>

      {error && (
        <div style={{ 
          background: 'oklch(0.96 0.04 25)', 
          border: '1px solid oklch(0.90 0.10 25)', 
          borderRadius: 12, 
          padding: '12px 16px', 
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'oklch(0.45 0.16 25)',
          fontSize: 14,
          fontWeight: 600
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Current Status Card */}
      <div style={{
        background: '#fff',
        border: '1px solid oklch(0.94 0.005 250)',
        borderRadius: 20,
        padding: 32,
        marginBottom: 40,
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ 
              width: 48, 
              height: 48, 
              borderRadius: 14, 
              background: 'oklch(0.20 0.02 250)', 
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={24} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'oklch(0.55 0.02 250)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>
                Current Plan
              </p>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                {user.plan === 'pro' ? 'Gild Pro' : 'Gild Free'}
              </h2>
            </div>
          </div>
          <span style={{
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            background: isActive ? 'oklch(0.96 0.04 150)' : 'oklch(0.96 0.005 250)',
            color: isActive ? 'oklch(0.40 0.15 150)' : 'oklch(0.40 0.02 250)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontFamily: GILD_FONTS.mono,
          }}>
            {(user.subscription_status || 'inactive').replace('_', ' ')}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {isActive && (
            <button
              onClick={handlePortal}
              disabled={isPending}
              style={{ ...secondaryButtonStyle, flex: '1 1 200px' }}
            >
              <CreditCard size={16} />
              Manage Payment Methods
            </button>
          )}
          <button
            onClick={() => handlePlanAction('pro')}
            disabled={isPending}
            style={{ ...primaryButtonStyle, flex: '1 1 200px' }}
          >
            {user.plan === 'pro' ? 'Renew or Upgrade' : 'Switch to Pro Plan'}
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Cancel subscription row — only visible when subscription is
            active. Subdued styling (text-button) because cancellation is
            destructive but rare. Confirmation modal gates the action. */}
        {isActive && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: '1px solid oklch(0.96 0.005 250)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'oklch(0.30 0.02 250)' }}>
                Cancel subscription
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'oklch(0.55 0.02 250)', lineHeight: 1.5 }}>
                You keep access until the end of the current billing period.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              disabled={isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'transparent',
                color: 'oklch(0.45 0.16 25)',
                border: '1px solid oklch(0.88 0.06 25)',
                fontSize: 13,
                fontWeight: 600,
                cursor: isPending ? 'default' : 'pointer',
                fontFamily: 'inherit',
                flexShrink: 0,
                opacity: isPending ? 0.6 : 1,
              }}
            >
              <X size={14} />
              Cancel subscription
            </button>
          </div>
        )}

        {cancelSuccess && (
          <p
            role="status"
            style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'oklch(0.96 0.05 150)',
              border: '1px solid oklch(0.85 0.10 150)',
              color: 'oklch(0.36 0.14 150)',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            Subscription canceled. You'll keep access until the end of your current billing period.
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel your Gild subscription?"
        message="You'll keep full access until the end of the current billing period. After that, your communities will pause until you resubscribe. This action can be reversed at any time before the period ends."
        confirmLabel="Yes, cancel subscription"
        cancelLabel="Keep subscription"
        isDestructive
      />

      {/* Pricing Grid */}
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Change your plan</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <PricingCard
          name="Free"
          price="$0"
          features={['Unlimited members', 'Courses, quizzes & certificates', 'Paid memberships', 'Analytics dashboard', '5% per member transaction']}
          active={user.plan !== 'pro'}
          onSelect={() => setShowCancelConfirm(true)}
          disabled={isPending}
        />
        <PricingCard
          name="Pro"
          price="$29"
          recommended
          features={['Everything in Free', '0% platform fees — keep 100%', 'Custom domain', 'Remove Gild branding', 'Priority support']}
          active={user.plan === 'pro'}
          onSelect={() => handlePlanAction('pro')}
          disabled={isPending}
        />
      </div>

      <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid oklch(0.96 0.005 250)', display: 'flex', justifyContent: 'center' }}>
         <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} />
            Secure payments by Stripe. 14-day free trial on all plans.
         </p>
      </footer>
    </div>
  );
}

function PricingCard({ name, price, features, recommended = false, active, onSelect, disabled }: any) {
  return (
    <div style={{
      background: '#fff',
      border: active ? '2px solid oklch(0.20 0.02 250)' : '1px solid oklch(0.94 0.005 250)',
      borderRadius: 20,
      padding: 32,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {recommended && (
        <span style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'oklch(0.20 0.02 250)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 800,
          padding: '4px 12px',
          borderRadius: 999,
          letterSpacing: '0.04em'
        }}>RECOMMENDED</span>
      )}
      <h4 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{name}</h4>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
        <span style={{ fontSize: 32, fontWeight: 800, fontFamily: GILD_FONTS.mono, letterSpacing: '-0.02em' }}>{price}</span>
        <span style={{ fontSize: 14, color: 'oklch(0.55 0.02 250)', fontFamily: GILD_FONTS.mono }}>/mo</span>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1 }}>
        {features.map((f: string) => (
          <li key={f} style={{ fontSize: 14, color: 'oklch(0.35 0.02 250)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Check size={14} style={{ color: 'oklch(0.50 0.15 150)' }} />
            {f}
          </li>
        ))}
      </ul>
      <button 
        onClick={onSelect}
        disabled={disabled || active}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: active ? 'default' : 'pointer',
          background: active ? 'oklch(0.96 0.005 250)' : 'oklch(0.20 0.02 250)',
          color: active ? 'oklch(0.55 0.02 250)' : '#fff',
          border: 'none',
          transition: 'all 0.2s ease'
        }}
      >
        {active ? 'Current Plan' : 'Choose Plan'}
      </button>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '14px 20px',
  borderRadius: 14,
  background: 'oklch(0.20 0.02 250)',
  color: '#fff',
  border: 'none',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '14px 20px',
  borderRadius: 14,
  background: '#fff',
  color: '#111',
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
};
