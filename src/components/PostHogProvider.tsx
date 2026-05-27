'use client';

// PostHog client-side init + identity sync.
// Wraps the entire app at src/app/layout.tsx so every page can fire
// posthog.capture() without manual init plumbing. Identity is synced to
// Supabase Auth via onAuthStateChange — anonymous visitors stay anonymous,
// authenticated visitors get identified once per session.

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { createBrowserClient } from '@supabase/ssr';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let initialized = false;

function initPostHog() {
  if (initialized || typeof window === 'undefined') return;
  if (!POSTHOG_KEY || !POSTHOG_HOST) return; // No-op in envs without keys.

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Capture pageviews + clicks automatically. Manual capture() lives
    // alongside this for the 4 named business events (signup, community_
    // created, post_published, subscription_started).
    capture_pageview: true,
    capture_pageleave: true,
    // Sanitize URL params before send — token leaks (WebAuthn setup,
    // password reset, magic links) must not reach PostHog.
    sanitize_properties: (properties) => {
      if (typeof properties.$current_url === 'string') {
        try {
          const url = new URL(properties.$current_url);
          for (const secret of ['token', 'setup_token', 'access_token']) {
            if (url.searchParams.has(secret)) url.searchParams.set(secret, '[REDACTED]');
          }
          properties.$current_url = url.toString();
        } catch {
          // ignore
        }
      }
      return properties;
    },
    // Session replay OFF by default — privacy + free-tier preservation.
    // Re-enable per-feature later if useful (record-on-error pattern).
    disable_session_recording: true,
    // Persistence in localStorage + cookie so the same anonymous user is
    // tracked across reloads but cleared when they explicitly sign out.
    persistence: 'localStorage+cookie',
    // Defer until window load so PostHog doesn't compete with FCP.
    loaded: () => {
      initialized = true;
    },
  });
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();

    // No-op if no keys configured (e.g., dev env without PostHog set up).
    if (!POSTHOG_KEY || !POSTHOG_HOST) return;

    // Sync identity with Supabase Auth.
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Hydrate identity from current session (if signed in on page load).
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        posthog.identify(user.id, { email: user.email });
      }
    });

    // Subscribe to subsequent auth state changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
      } else if (event === 'SIGNED_OUT') {
        posthog.reset(); // Clears the identity so the next visitor starts anonymous.
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
