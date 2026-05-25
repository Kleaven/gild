import './src/lib/env'; // Validates all env vars at build/dev startup
import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

// Wrap with Sentry config so source-maps upload to Sentry at build time.
// Skips upload (without erroring the build) when SENTRY_AUTH_TOKEN is unset
// — useful for local dev and PR previews without Sentry secrets.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Tunnel through a Next.js route to bypass adblockers that block direct
  // requests to ingest.sentry.io. Costs one extra hop but boosts capture
  // rate on users with privacy extensions.
  tunnelRoute: '/monitoring',

  // Suppress the "no auth token" warning when intentionally building
  // without one (local dev, PR previews).
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Hide source maps from the production bundle once uploaded.
  hideSourceMaps: true,

  // Strip Sentry SDK debug logger from prod bundle.
  disableLogger: true,

  // Only upload source maps; don't touch the build otherwise.
  widenClientFileUpload: true,
});
