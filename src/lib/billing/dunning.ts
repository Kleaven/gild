import 'server-only';

import db from '../db';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DunningEmailType =
  | 'trial_ending_3_days'
  | 'trial_expired'
  | 'payment_failed'
  | 'subscription_canceled';

// Human-readable subject lines keyed on DunningEmailType.
// Stored in email_queue.subject (required NOT NULL field).
// email_queue.template holds the DunningEmailType value used for routing.
const SUBJECTS: Record<DunningEmailType, string> = {
  trial_ending_3_days: 'Your free trial ends in 3 days',
  trial_expired: 'Your free trial has ended',
  payment_failed: 'Action required: payment failed for your community',
  subscription_canceled: 'Your Gild subscription has been canceled',
};

// ─── queueDunningEmail ────────────────────────────────────────────────────────
// Inserts one row into email_queue for the given recipient + type.
//
// DEVIATION from spec: email_queue has no 'type' or 'community_id' column.
//   - communityId param is retained for future schema alignment and call-site
//     clarity, but is not written to the DB (no column exists).
//   - DunningEmailType is stored in `template` (designed for template names),
//     not `subject`. `subject` receives a human-readable string per type.
//   - Idempotency guard uses (to_email, template) within 7 days since
//     community_id is unavailable as a filter column.
//
// Idempotency: calling twice within 7 days for the same recipient+type
// queues only one email — the second INSERT is silently skipped.

export async function queueDunningEmail(
  _communityId: string,
  recipientEmail: string,
  type: DunningEmailType,
): Promise<void> {
  await db`
    INSERT INTO public.email_queue (to_email, subject, template)
    SELECT
      ${recipientEmail},
      ${SUBJECTS[type]},
      ${type}
    // TODO(Step 50): email_queue has no community_id column — idempotency guard
    // deduplicates on (to_email, template) only. Owners with multiple communities
    // in the same dunning state will only receive one email within the 7-day window.
    // Fix: add community_id column to email_queue in a future migration and update
    // this guard to (to_email, template, community_id).
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.email_queue
      WHERE to_email = ${recipientEmail}
        AND template  = ${type}
        AND created_at > now() - interval '7 days'
    )
  `;
}

// ─── Community row returned by dunning queries ────────────────────────────────

type DunningRow = { id: string; owner_email: string };

// ─── checkAndQueueExpiringTrials ──────────────────────────────────────────────
// Finds communities whose trial ends within the next 3 days and queues a
// 'trial_ending_3_days' email for each owner.
// Returns { queued: N } where N = number of communities matched (the
// idempotency guard in queueDunningEmail silently skips repeat sends).

export async function checkAndQueueExpiringTrials(): Promise<{ queued: number }> {
  const rows = await db<DunningRow[]>`
    SELECT c.id, p.email AS owner_email
    FROM   public.communities c
    JOIN   auth.users p ON p.id = c.owner_id
    WHERE  c.subscription_status = 'trialing'
      AND  c.trial_ends_at IS NOT NULL
      AND  c.trial_ends_at BETWEEN now() AND now() + interval '3 days'
  `;

  for (const row of rows) {
    await queueDunningEmail(row.id, row.owner_email, 'trial_ending_3_days');
  }

  return { queued: rows.length };
}

// ─── checkAndQueueExpiredTrials ───────────────────────────────────────────────
// Finds communities whose trial_ends_at is in the past and subscription is
// still 'trialing' (Stripe webhook may not have fired yet). Queues a
// 'trial_expired' email for each owner.
//
// NOTE: This function does NOT update subscription_status — the Stripe webhook
// (customer.subscription.updated / deleted) is the authoritative owner of
// subscription status. This only queues the notification email.

export async function checkAndQueueExpiredTrials(): Promise<{ queued: number }> {
  const rows = await db<DunningRow[]>`
    SELECT c.id, p.email AS owner_email
    FROM   public.communities c
    JOIN   auth.users p ON p.id = c.owner_id
    WHERE  c.subscription_status = 'trialing'
      AND  c.trial_ends_at IS NOT NULL
      AND  c.trial_ends_at < now()
  `;

  for (const row of rows) {
    await queueDunningEmail(row.id, row.owner_email, 'trial_expired');
  }

  return { queued: rows.length };
}

// ─── checkAndQueuePastDue ─────────────────────────────────────────────────────
// Finds communities with subscription_status = 'past_due' (invoice payment
// failed) and queues a 'payment_failed' email for each owner.

export async function checkAndQueuePastDue(): Promise<{ queued: number }> {
  const rows = await db<DunningRow[]>`
    SELECT c.id, p.email AS owner_email
    FROM   public.communities c
    JOIN   auth.users p ON p.id = c.owner_id
    WHERE  c.subscription_status = 'past_due'
  `;

  for (const row of rows) {
    await queueDunningEmail(row.id, row.owner_email, 'payment_failed');
  }

  return { queued: rows.length };
}
