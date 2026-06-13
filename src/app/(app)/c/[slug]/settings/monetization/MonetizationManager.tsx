'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GILD_FONTS } from '@/components/gild';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CreditCard, Plus, Pencil, Check, ExternalLink, RefreshCw, GripVertical } from 'lucide-react';
import type { ConnectStatus } from '@/lib/billing/connect';
import type { Tier } from '@/lib/community/tiers';
import {
  startPayoutOnboarding,
  refreshPayoutStatus,
  createTierAction,
  updateTierAction,
  deactivateTierAction,
  reorderTiersAction,
} from '@/app/actions/monetization';
import { updateCommunity } from '@/app/actions';

type EntryPricing = {
  type: 'free' | 'paid';
  amount: number;
  period: 'one_time' | 'monthly' | 'yearly';
};

interface Props {
  communityId: string;
  communitySlug: string;
  initialStatus: ConnectStatus;
  initialTiers: Tier[];
  initialPricing: EntryPricing;
}

type EditState =
  | { mode: 'closed' }
  | { mode: 'create' }
  | { mode: 'edit'; tier: Tier };

export function MonetizationManager({ communityId, initialStatus, initialTiers, initialPricing }: Props) {
  const router = useRouter();
  const [status] = useState(initialStatus);
  const [edit, setEdit] = useState<EditState>({ mode: 'closed' });
  const [confirmTier, setConfirmTier] = useState<Tier | null>(null);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const connected = status.accountId !== null;
  const live = status.chargesEnabled;

  // Drag-to-reorder: local order of active tiers, synced from server props.
  const [orderedActive, setOrderedActive] = useState<Tier[]>(() => initialTiers.filter((t) => t.isActive));
  useEffect(() => {
    setOrderedActive(initialTiers.filter((t) => t.isActive));
  }, [initialTiers]);
  const dragId = useRef<string | null>(null);
  const [reordering, setReordering] = useState(false);

  // ── Entry pricing (what new members pay to join) ──────────────────────────
  const [entryType, setEntryType] = useState<'free' | 'paid'>(initialPricing.type);
  const [entryAmount, setEntryAmount] = useState<string>(String(initialPricing.amount || ''));
  const [entryPeriod, setEntryPeriod] = useState<EntryPricing['period']>(initialPricing.period);
  const [entrySaving, setEntrySaving] = useState(false);
  const [entrySaved, setEntrySaved] = useState(false);

  async function handleSaveEntryPricing() {
    setError(null);
    setEntrySaved(false);
    if (entryType === 'paid' && (!Number(entryAmount) || Number(entryAmount) < 1)) {
      setError('Set a price of at least $1 for a paid community.');
      return;
    }
    setEntrySaving(true);
    try {
      const result = await updateCommunity(communityId, {
        pricing_type: entryType,
        price_amount: entryType === 'paid' ? Number(entryAmount) : 0,
        pricing_period: entryPeriod,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setEntrySaved(true);
      setTimeout(() => setEntrySaved(false), 2500);
    } catch {
      setError('Couldn’t save entry pricing. Please try again.');
    } finally {
      setEntrySaving(false);
    }
  }

  function handleDrop(targetId: string) {
    const src = dragId.current;
    dragId.current = null;
    if (!src || src === targetId) return;
    const from = orderedActive.findIndex((t) => t.id === src);
    const to = orderedActive.findIndex((t) => t.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...orderedActive];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    setOrderedActive(next);
    setError(null);
    setReordering(true);
    reorderTiersAction(communityId, next.map((t) => t.id))
      .then(() => router.refresh())
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Could not save the new order.');
        setOrderedActive(initialTiers.filter((t) => t.isActive));
      })
      .finally(() => setReordering(false));
  }

  function handleConnect() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await startPayoutOnboarding(communityId);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        window.location.href = res.url;
      } catch {
        setError('We couldn’t reach Stripe just now. Please try again in a minute.');
      }
    });
  }

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      try {
        await refreshPayoutStatus(communityId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not refresh status.');
      }
    });
  }

  function handleDeactivate() {
    const tier = confirmTier;
    setConfirmTier(null);
    if (!tier) return;
    setError(null);
    startTransition(async () => {
      try {
        await deactivateTierAction(tier.id, communityId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not archive the tier.');
      }
    });
  }

  const archivedTiers = initialTiers.filter((t) => !t.isActive);

  return (
    <div style={{ fontFamily: GILD_FONTS.sans, color: '#111', maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: GILD_FONTS.display, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
          Monetization
        </h1>
        <p style={{ color: 'oklch(0.55 0.02 250)', fontSize: 14, margin: 0, lineHeight: 1.5 }}>
          Get paid directly by your members. Gild takes 0% — payments go straight to your Stripe account.
        </p>
      </header>

      {error && (
        <div style={bannerStyle('error')}>{error}</div>
      )}

      {/* ── Payout account ─────────────────────────────────────────────── */}
      <section style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={iconBadge}>
            <CreditCard size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontFamily: GILD_FONTS.display, fontSize: 18, fontWeight: 800, margin: 0 }}>Payout account</h2>
            <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: '2px 0 0' }}>
              Powered by Stripe Connect.
            </p>
          </div>
          {connected && live && (
            <span style={pill('green')}>
              <Check size={13} /> Connected
            </span>
          )}
          {connected && !live && <span style={pill('amber')}>Setup incomplete</span>}
        </div>

        {!connected && (
          <>
            <p style={{ fontSize: 14, color: 'oklch(0.40 0.02 250)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Connect a Stripe account to start charging members for tiers. You&apos;ll be taken to
              Stripe to verify your details — it&apos;s free and takes a few minutes.
            </p>
            <button onClick={handleConnect} disabled={busy} style={primaryBtn(busy)}>
              <ExternalLink size={16} /> {busy ? 'Starting…' : 'Connect with Stripe'}
            </button>
          </>
        )}

        {connected && !live && (
          <>
            <p style={{ fontSize: 14, color: 'oklch(0.40 0.02 250)', lineHeight: 1.6, margin: '0 0 16px' }}>
              Your Stripe account is created but not ready to accept payments yet. Finish the
              remaining steps, then refresh.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={handleConnect} disabled={busy} style={primaryBtn(busy)}>
                <ExternalLink size={16} /> Finish Stripe setup
              </button>
              <button onClick={handleRefresh} disabled={busy} style={secondaryBtn(busy)}>
                <RefreshCw size={15} /> Refresh status
              </button>
            </div>
          </>
        )}

        {connected && live && (
          <p style={{ fontSize: 14, color: 'oklch(0.40 0.02 250)', lineHeight: 1.6, margin: 0 }}>
            You&apos;re ready to accept member payments. Create tiers below and gate course modules
            behind them.
          </p>
        )}
      </section>

      {/* ── Entry pricing ──────────────────────────────────────────────── */}
      <section style={{ ...cardStyle, marginTop: 20 }}>
        <div style={{ marginBottom: 14 }}>
          <h2 style={{ fontFamily: GILD_FONTS.display, fontSize: 18, fontWeight: 800, margin: 0 }}>Entry pricing</h2>
          <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: '2px 0 0', lineHeight: 1.5 }}>
            What new members pay to join — charged on <strong>your</strong> Stripe account at the
            join page, 0% to Gild. Tiers below are separate upgrades members buy once inside.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: entryType === 'paid' ? 14 : 0 }}>
          {(['free', 'paid'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEntryType(t)}
              disabled={t === 'paid' && !connected}
              aria-pressed={entryType === t}
              title={t === 'paid' && !connected ? 'Connect your payout account first' : undefined}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: 12,
                border: entryType === t ? '2px solid oklch(0.25 0.02 250)' : '1px solid oklch(0.90 0.01 250)',
                background: entryType === t ? 'oklch(0.97 0.005 250)' : '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: t === 'paid' && !connected ? 'default' : 'pointer',
                opacity: t === 'paid' && !connected ? 0.5 : 1,
                fontFamily: 'inherit',
              }}
            >
              {t === 'free' ? 'Free to join' : 'Paid to join'}
            </button>
          ))}
        </div>

        {!connected && (
          <p style={{ fontSize: 12.5, color: 'oklch(0.50 0.10 75)', margin: '10px 0 0', fontWeight: 600 }}>
            Paid joining unlocks once your payout account above is connected — that’s where the
            money lands.
          </p>
        )}

        {entryType === 'paid' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'oklch(0.40 0.02 250)', marginBottom: 6 }}>
                Price (USD)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={entryAmount}
                onChange={(e) => setEntryAmount(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="12"
                style={entryInput}
              />
            </div>
            <div style={{ flex: 1, minWidth: 130 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'oklch(0.40 0.02 250)', marginBottom: 6 }}>
                Billing
              </label>
              <select
                value={entryPeriod}
                onChange={(e) => setEntryPeriod(e.target.value as EntryPricing['period'])}
                style={{ ...entryInput, cursor: 'pointer' }}
              >
                <option value="one_time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button onClick={handleSaveEntryPricing} disabled={entrySaving} style={primaryBtn(entrySaving)}>
            {entrySaving ? 'Saving…' : 'Save entry pricing'}
          </button>
          {entrySaved && (
            <span style={{ fontSize: 13, fontWeight: 700, color: 'oklch(0.42 0.14 150)' }}>Saved ✓</span>
          )}
        </div>
      </section>

      {/* ── Tiers ──────────────────────────────────────────────────────── */}
      <section style={{ ...cardStyle, marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontFamily: GILD_FONTS.display, fontSize: 18, fontWeight: 800, margin: 0 }}>Membership tiers</h2>
            <p style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', margin: '2px 0 0' }}>
              Monthly subscriptions. Rank low → high; higher tiers unlock everything below them.
            </p>
          </div>
          <button
            onClick={() => { setError(null); setEdit({ mode: 'create' }); }}
            disabled={!connected}
            title={connected ? 'Add a tier' : 'Connect a payout account first'}
            style={primaryBtn(!connected)}
          >
            <Plus size={16} /> Add tier
          </button>
        </div>

        {orderedActive.length === 0 ? (
          <p style={{ fontSize: 14, color: 'oklch(0.55 0.02 250)', margin: 0, padding: '12px 0' }}>
            No tiers yet. {connected ? 'Add your first tier to start monetizing.' : 'Connect a payout account, then add tiers.'}
          </p>
        ) : (
          <>
            {orderedActive.length > 1 && (
              <p style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)', margin: '0 0 10px' }}>
                Drag to reorder — top is the lowest tier; higher tiers unlock everything below.
              </p>
            )}
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10, opacity: reordering ? 0.6 : 1 }}>
              {orderedActive.map((tier, i) => (
                <li
                  key={tier.id}
                  draggable={!reordering}
                  onDragStart={() => { dragId.current = tier.id; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(tier.id)}
                  style={{ ...tierRow, cursor: reordering ? 'default' : 'grab' }}
                >
                  <GripVertical size={16} color="oklch(0.75 0.01 250)" style={{ flexShrink: 0 }} />
                  <span style={tierRank}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{tier.name}</div>
                    {tier.description && (
                      <div style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', marginTop: 2 }}>{tier.description}</div>
                    )}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 15, fontFamily: GILD_FONTS.mono, whiteSpace: 'nowrap' }}>
                    ${tier.priceMonthUsd}<span style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)', fontWeight: 500 }}>/mo</span>
                  </div>
                  <button onClick={() => { setError(null); setEdit({ mode: 'edit', tier }); }} title="Edit tier" style={iconBtn}>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => setConfirmTier(tier)} title="Archive tier" style={{ ...iconBtn, color: 'oklch(0.50 0.16 25)' }}>
                    Archive
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {archivedTiers.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid oklch(0.95 0.005 250)' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'oklch(0.55 0.02 250)', margin: '0 0 8px', fontFamily: GILD_FONTS.mono, letterSpacing: '0.06em' }}>
              ARCHIVED
            </p>
            {archivedTiers.map((tier) => (
              <div key={tier.id} style={{ fontSize: 13, color: 'oklch(0.60 0.02 250)', padding: '4px 0' }}>
                {tier.name} · ${tier.priceMonthUsd}/mo
              </div>
            ))}
          </div>
        )}
      </section>

      {edit.mode !== 'closed' && (
        <TierEditor
          communityId={communityId}
          tier={edit.mode === 'edit' ? edit.tier : null}
          onClose={() => setEdit({ mode: 'closed' })}
          onSaved={() => { setEdit({ mode: 'closed' }); router.refresh(); }}
        />
      )}

      <ConfirmDialog
        open={confirmTier !== null}
        title="Archive this tier?"
        message={
          confirmTier
            ? `"${confirmTier.name}" will stop appearing for new members and can no longer be used to gate modules. Members already subscribed keep their access until they cancel. This can't be undone.`
            : ''
        }
        confirmLabel="Archive tier"
        busy={busy}
        onConfirm={handleDeactivate}
        onCancel={() => setConfirmTier(null)}
      />
    </div>
  );
}

// ─── Tier create/edit modal ────────────────────────────────────────────────

function TierEditor({
  communityId,
  tier,
  onClose,
  onSaved,
}: {
  communityId: string;
  tier: Tier | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(tier?.name ?? '');
  const [description, setDescription] = useState(tier?.description ?? '');
  const [price, setPrice] = useState<string>(tier ? String(tier.priceMonthUsd) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (!name.trim()) return 'Give the tier a name.';
    const p = Number(price);
    if (!Number.isInteger(p) || p < 1 || p > 100000) return 'Price must be a whole dollar amount (1–100000).';
    return null;
  }

  async function handleSave() {
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setSaving(true);
    try {
      const input = { name: name.trim(), description: description.trim() || null, priceMonthUsd: Number(price) };
      if (tier) await updateTierAction(tier.id, communityId, input);
      else await createTierAction(communityId, input);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the tier.');
      setSaving(false);
    }
  }

  return (
    <div style={overlay} onClick={saving ? undefined : onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: GILD_FONTS.display, fontSize: 20, fontWeight: 800, margin: '0 0 16px' }}>
          {tier ? 'Edit tier' : 'New tier'}
        </h2>
        <label style={label}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} placeholder="Anything you like — e.g. Wise Elf, Inner Circle, Pro" style={input} />
        <p style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)', margin: '6px 0 0' }}>
          Name it to fit your community. Tiers rank in the order you create them
          (lowest first) — higher tiers unlock everything below.
        </p>
        <label style={label}>Description <span style={{ fontWeight: 400, color: 'oklch(0.6 0.02 250)' }}>(optional)</span></label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={2} placeholder="What members get at this tier" style={{ ...input, resize: 'vertical' }} />
        <label style={label}>Price (USD / month)</label>
        <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="29" style={input} />
        {tier && Number(price) !== tier.priceMonthUsd && (
          <p style={{ fontSize: 12, color: 'oklch(0.50 0.10 75)', margin: '4px 0 0' }}>
            Changing the price only affects new subscribers — existing members keep their current rate.
          </p>
        )}
        {error && <p style={{ color: '#c00', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
          <button onClick={onClose} disabled={saving} style={secondaryBtn(saving)}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtn(saving)}>
            {saving ? 'Saving…' : tier ? 'Save changes' : 'Create tier'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  border: '1px solid oklch(0.92 0.01 250)',
  borderRadius: 16,
  background: '#fff',
  padding: 24,
};

const iconBadge: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
  background: 'oklch(0.96 0.01 250)', color: 'oklch(0.40 0.02 250)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const tierRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '14px 16px', border: '1px solid oklch(0.93 0.01 250)', borderRadius: 12,
};

const tierRank: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
  background: 'oklch(0.96 0.01 250)', color: 'oklch(0.45 0.02 250)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, fontWeight: 700, fontFamily: GILD_FONTS.mono,
};

const iconBtn: React.CSSProperties = {
  background: 'transparent', border: '1px solid oklch(0.90 0.01 250)', borderRadius: 8,
  padding: '6px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
  color: 'oklch(0.45 0.02 250)', display: 'inline-flex', alignItems: 'center', gap: 5,
  fontFamily: 'inherit',
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '10px 18px', borderRadius: 12, border: 'none',
    background: disabled ? 'oklch(0.80 0.01 250)' : '#111', color: '#fff',
    fontSize: 14, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit',
  };
}

function secondaryBtn(disabled: boolean): React.CSSProperties {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '10px 16px', borderRadius: 12, border: '1px solid oklch(0.90 0.01 250)',
    background: 'transparent', color: '#111', fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer', fontFamily: 'inherit',
  };
}

function pill(tone: 'green' | 'amber'): React.CSSProperties {
  const tones = {
    green: { bg: 'oklch(0.95 0.05 150)', fg: 'oklch(0.40 0.12 150)' },
    amber: { bg: 'oklch(0.95 0.06 75)', fg: 'oklch(0.45 0.12 75)' },
  }[tone];
  return {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
    background: tones.bg, color: tones.fg,
  };
}

function bannerStyle(_tone: 'error'): React.CSSProperties {
  return {
    padding: '12px 16px', borderRadius: 12, marginBottom: 16,
    background: 'oklch(0.96 0.03 25)', border: '1px solid oklch(0.88 0.06 25)',
    color: 'oklch(0.40 0.16 25)', fontSize: 13, fontWeight: 600,
  };
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.4)',
  backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};

const modal: React.CSSProperties = {
  background: '#fff', width: '100%', maxWidth: 460, borderRadius: 20, padding: 24,
  boxShadow: '0 20px 40px rgba(0,0,0,0.18)', fontFamily: GILD_FONTS.sans,
};

const label: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 700, color: 'oklch(0.40 0.02 250)',
  margin: '14px 0 6px',
};

const input: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1px solid oklch(0.90 0.01 250)', fontSize: 14, outline: 'none',
  fontFamily: 'inherit', boxSizing: 'border-box',
};

const entryInput: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid oklch(0.90 0.01 250)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};
