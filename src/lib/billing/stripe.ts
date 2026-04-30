import 'server-only';

import Stripe from 'stripe';
import { env } from '../env';

// Preserve Stripe instance across Next.js HMR in development.
// In production, each serverless invocation cold-starts fresh.
const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

export const stripe: Stripe =
  globalForStripe.stripe ??
  new Stripe(env.STRIPE_SECRET_KEY, {
    // apiVersion intentionally omitted — SDK v22 defaults to '2026-04-22.dahlia'
    // which matches its generated TypeScript types exactly.
    // Pinning manually creates a type/runtime mismatch. See VETTING.md.
    appInfo: {
      name: 'Gild',
      url: env.NEXT_PUBLIC_APP_URL,
    },
    httpClient: Stripe.createFetchHttpClient(),
    typescript: true,
    telemetry: false,
  });

if (env.NODE_ENV !== 'production') {
  globalForStripe.stripe = stripe;
}
