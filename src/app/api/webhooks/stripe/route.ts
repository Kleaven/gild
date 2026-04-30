import { NextResponse } from 'next/server';
import { stripe } from '@/lib/billing/stripe';
import { env } from '@/lib/env';
import { processWebhookEvent } from '@/lib/billing/webhook';
import type { WebhookHandlerMap } from '@/lib/billing/webhook';

// Step 40 will populate this map with actual event handlers.
// For now all events are logged into webhook_events but no business logic runs.
const handlers: WebhookHandlerMap = {};

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await processWebhookEvent(event, handlers);
  } catch {
    // Handler threw — return 500 so Stripe retries
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
