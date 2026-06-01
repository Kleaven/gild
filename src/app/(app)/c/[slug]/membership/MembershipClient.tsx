'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GILD_FONTS } from '@/components/gild';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Check, Sparkles } from 'lucide-react';
import type { MembershipState } from '@/lib/billing/member-subscription';
import { startTierCheckout, cancelMembershipAction } from '@/app/actions/monetization';

interface TierView {
  id: string;
  name: string;
  description: string | null;
  priceMonthUsd: number;
  position: number;
}

interface Props {
  communityId: string;
  communitySlug: string;
  communityName: string;
  tiers: TierView[];
  state: MembershipState;
}

export function MembershipClient({ communityId, communityName, tiers, state }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [busyTier, setBusyTier] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPosition =
    state.active && state.tierId ? tiers.find((t) => t.id === state.tierId)?.position ?? null : null;

  function handlePick(tierId: string) {
    setError(null);
    setBusyTier(tierId);
    startTierCheckout(communityId, tierId, pathname)
      .then((res) => {
        if (res.kind === 'checkout') {
          window.location.href = res.url;
        } else {
          router.refresh();
          setBusyTier(null);
        }
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
        setBusyTier(null);
      });
  }

  function handleCancel() {
    setConfirmCancel(false);
    setError(null);
    setCancelling(true);
    cancelMembershipAction(communityId)
      .then(() => router.refresh())
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Could not cancel.');
      })
      .finally(() => setCancelling(false));
  }

  const cancelAtDate = state.cancelAt ? new Date(state.cancelAt).toLocaleDateString() : null;

  return (
    <div style={{ fontFamily: GILD_FONTS.sans, color: '#111', maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: GILD_FONTS.display, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Membership
        </h1>
        <p style={{ color: 'oklch(0.55 0.02 250)', fontSize: 14, margin: 0 }}>
          Subscribe to unlock premium content in {communityName}.
        </p>
      </header>

      {error && (
        <div style={banner}>{error}</div>
      )}

      {/* Current plan */}
      {state.active && state.tierName && (
        <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(0.45 0.12 150)', fontFamily: GILD_FONTS.mono, letterSpacing: '0.06em' }}>
              CURRENT PLAN
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: GILD_FONTS.display, marginTop: 2 }}>
              {state.tierName}
            </div>
            <div style={{ fontSize: 13, color: 'oklch(0.50 0.02 250)', marginTop: 2 }}>
              {cancelAtDate ? `Access ends ${cancelAtDate} — won't renew.` : 'Renews monthly.'}
            </div>
          </div>
          {!cancelAtDate && (
            <button onClick={() => setConfirmCancel(true)} disabled={cancelling} style={ghostBtn(cancelling)}>
              {cancelling ? 'Cancelling…' : 'Cancel membership'}
            </button>
          )}
        </div>
      )}

      {/* Tiers */}
      {tiers.length === 0 ? (
        <div style={{ ...card, color: 'oklch(0.55 0.02 250)', fontSize: 14 }}>
          This community doesn&apos;t offer paid tiers yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tiers.map((tier) => {
            const isCurrent = state.active && state.tierId === tier.id;
            const isUpgrade = currentPosition !== null && tier.position > currentPosition;
            const isDowngrade = currentPosition !== null && tier.position < currentPosition;
            const label = isCurrent
              ? 'Current plan'
              : currentPosition === null
                ? 'Subscribe'
                : isUpgrade
                  ? 'Upgrade'
                  : isDowngrade
                    ? 'Switch'
                    : 'Switch';
            return (
              <div key={tier.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', ...(isCurrent ? currentRing : null) }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 17, fontWeight: 800 }}>{tier.name}</span>
                    {isCurrent && (
                      <span style={currentPill}>
                        <Check size={12} /> Active
                      </span>
                    )}
                  </div>
                  {tier.description && (
                    <p style={{ fontSize: 13, color: 'oklch(0.50 0.02 250)', margin: '4px 0 0', lineHeight: 1.5 }}>
                      {tier.description}
                    </p>
                  )}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: GILD_FONTS.mono, whiteSpace: 'nowrap' }}>
                  ${tier.priceMonthUsd}
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'oklch(0.55 0.02 250)' }}>/mo</span>
                </div>
                <button
                  onClick={() => handlePick(tier.id)}
                  disabled={isCurrent || busyTier !== null}
                  style={isCurrent ? disabledBtn : primaryBtn(busyTier !== null)}
                >
                  {busyTier === tier.id ? 'Starting…' : (
                    <>
                      {!isCurrent && currentPosition === null && <Sparkles size={15} />}
                      {label}
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel membership?"
        message={`You'll keep ${state.tierName ?? 'your tier'} access until the end of your current paid period, then it won't renew. You can resubscribe anytime.`}
        confirmLabel="Cancel membership"
        busy={cancelling}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}

const card: React.CSSProperties = {
  border: '1px solid oklch(0.92 0.01 250)',
  borderRadius: 16,
  background: '#fff',
  padding: 20,
};

const currentRing: React.CSSProperties = {
  borderColor: 'oklch(0.75 0.10 150)',
  boxShadow: '0 0 0 1px oklch(0.75 0.10 150)',
};

const currentPill: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
  background: 'oklch(0.95 0.05 150)', color: 'oklch(0.40 0.12 150)',
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 18px', borderRadius: 12, border: 'none',
    background: disabled ? 'oklch(0.80 0.01 250)' : '#111', color: '#fff',
    fontSize: 14, fontWeight: 700, cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
  };
}

const disabledBtn: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 12, border: '1px solid oklch(0.90 0.01 250)',
  background: 'transparent', color: 'oklch(0.55 0.02 250)', fontSize: 14, fontWeight: 600,
  cursor: 'default', fontFamily: 'inherit',
};

function ghostBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '9px 16px', borderRadius: 12, border: '1px solid oklch(0.88 0.06 25)',
    background: 'transparent', color: 'oklch(0.45 0.16 25)', fontSize: 13, fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
  };
}

const banner: React.CSSProperties = {
  padding: '12px 16px', borderRadius: 12, marginBottom: 16,
  background: 'oklch(0.96 0.03 25)', border: '1px solid oklch(0.88 0.06 25)',
  color: 'oklch(0.40 0.16 25)', fontSize: 13, fontWeight: 600,
};
