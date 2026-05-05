import 'server-only';

import db from '../db';
import { env } from '../env';
import { resend } from './client';
import { renderTemplate } from './templates';

// ─── Types ────────────────────────────────────────────────────────────────────

type EmailRow = {
  id: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  template: string;
  variables: Record<string, unknown>;
};

// ─── processPendingEmails ─────────────────────────────────────────────────────
// Claims a batch of pending emails and sends each via Resend.
//
// Concurrency: uses FOR UPDATE SKIP LOCKED inside a transaction — rows are
// locked for the transaction duration, preventing concurrent workers from
// picking the same batch. No 'processing' enum value exists in email_status
// (enum: pending|sent|failed|cancelled), so the row lock is the claim
// mechanism rather than a status update.
//
// Claim-before-send guarantee: SELECT acquires the lock before any send
// attempt. Other connections skip locked rows via SKIP LOCKED. On success
// the row is updated to 'sent'; on failure to 'failed'. Failed rows are not
// automatically re-queued — they require manual intervention or a separate
// retry policy.
//
// Never throws — always returns { sent, failed } counts.

export async function processPendingEmails(): Promise<{ sent: number; failed: number }> {
  try {
    const result = await db.begin(async (sql) => {
      // Claim up to 50 pending emails due for delivery.
      // FOR UPDATE SKIP LOCKED: concurrent cron invocations skip this batch.
      const rows = await sql<EmailRow[]>`
        SELECT id, to_email, to_name, subject, template, variables
        FROM public.email_queue
        WHERE status = 'pending'
          AND scheduled_at <= now()
        ORDER BY scheduled_at ASC
        LIMIT 50
        FOR UPDATE SKIP LOCKED
      `;

      let sent = 0;
      let failed = 0;

      for (const row of rows) {
        try {
          // Cast jsonb values to strings — variables are system-populated
          const vars: Record<string, string> = Object.fromEntries(
            Object.entries(row.variables).map(([k, val]) => [k, String(val)]),
          );

          const rendered = renderTemplate(row.template, vars);

          const response = await resend.emails.send({
            from: env.RESEND_FROM_EMAIL,
            to: row.to_email,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text,
          });

          if (response.error) {
            throw new Error(response.error.message);
          }

          const providerId = response.data.id;

          await sql`
            UPDATE public.email_queue SET
              status    = 'sent',
              provider_id = ${providerId},
              sent_at   = now()
            WHERE id = ${row.id}
          `;
          sent++;
        } catch (err) {
          // Truncate to 500 chars — error messages are technical only,
          // never include to_email or other PII.
          const errorText =
            err instanceof Error ? err.message.slice(0, 500) : 'send failed';

          await sql`
            UPDATE public.email_queue SET
              status = 'failed',
              error  = ${errorText}
            WHERE id = ${row.id}
          `;
          failed++;
        }
      }

      return { sent, failed };
    });

    return result;
  } catch {
    // Transaction-level failure (e.g. DB connection drop) — return zero counts.
    // Rows remain 'pending' and will be retried on the next cron run.
    return { sent: 0, failed: 0 };
  }
}
