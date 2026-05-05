export const runtime = 'nodejs';

import { env } from '@/lib/env';
import {
  checkAndQueueExpiringTrials,
  checkAndQueueExpiredTrials,
  checkAndQueuePastDue,
} from '@/lib/billing/dunning';
import { processPendingEmails } from '@/lib/email';

// Vercel cron invokes GET with Authorization: Bearer <CRON_SECRET>.
// Schedule: "0 9 * * *" — daily at 09:00 UTC (see vercel.json).
export async function GET(request: Request): Promise<Response> {
  // Step 1 — Authenticate. Compare constant-time equivalent via full string match.
  // Never log the secret or the Authorization header value.
  const authorization = request.headers.get('authorization');
  if (authorization !== `Bearer ${env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Steps 2-3 — Run all dunning checks in parallel, then flush the email queue.
  try {
    const [expiring, expired, pastDue] = await Promise.all([
      checkAndQueueExpiringTrials(),
      checkAndQueueExpiredTrials(),
      checkAndQueuePastDue(),
    ]);

    // Step 4 — Send pending emails (including those just queued above).
    // processPendingEmails never throws — safe to call without try/catch.
    const emailResult = await processPendingEmails();

    return Response.json({
      ok: true,
      queued: {
        expiring: expiring.queued,
        expired: expired.queued,
        pastDue: pastDue.queued,
      },
      emails: {
        sent: emailResult.sent,
        failed: emailResult.failed,
      },
    });
  } catch (err) {
    // Do not include PII in error messages — only safe error text.
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
