// Temporary verification route — proves Sentry captures server-side errors
// end-to-end (signature, source-map upload, ingest). Delete this file once
// you've seen the corresponding error in the Sentry dashboard.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Guard so accidental traffic in prod doesn't keep creating noise.
  // Set NEXT_PUBLIC_SENTRY_TEST_ENABLED=true in env to use; default off.
  if (process.env.NEXT_PUBLIC_SENTRY_TEST_ENABLED !== 'true') {
    return NextResponse.json(
      {
        error: 'sentry-test is disabled. Set NEXT_PUBLIC_SENTRY_TEST_ENABLED=true to enable for one verification, then delete this route.',
      },
      { status: 410 },
    );
  }

  throw new Error('[gild] sentry-test: this error is intentional — Sentry pipeline verification.');
}
