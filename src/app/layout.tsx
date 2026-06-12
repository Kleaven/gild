import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Fraunces, Hanken_Grotesk, JetBrains_Mono, Gochi_Hand } from 'next/font/google';
import { gildKeyframes } from '@/components/gild';

// Display: Fraunces — a warm, characterful serif with optical sizing; reads
// editorial and hand-set, never template-default. Body: Hanken Grotesk — a
// humanist grotesque that stays friendly at UI sizes.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz'],
});

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const gochi = Gochi_Hand({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-gochi',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://gild-flax.vercel.app'),
  title: {
    default: 'Gild — The home for paid communities',
    template: '%s · Gild',
  },
  description:
    'Run spaces, teach courses, and sell memberships with 0% transaction fees. Payments go straight to your Stripe account — Gild never takes a cut.',
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    siteName: 'Gild',
    title: 'Gild — The home for paid communities',
    description:
      'Spaces, courses, quizzes, and membership tiers for premium creators. 0% transaction fees, forever.',
    images: [{ url: '/icons/icon-512.png', width: 512, height: 512, alt: 'Gild' }],
  },
  twitter: {
    card: 'summary',
    title: 'Gild — The home for paid communities',
    description:
      'Spaces, courses, quizzes, and membership tiers for premium creators. 0% transaction fees, forever.',
    images: ['/icons/icon-512.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gild',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
};

import { Toaster } from 'sonner';
import PostHogProvider from '@/components/PostHogProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} ${jetbrains.variable} ${gochi.variable}`}>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <style dangerouslySetInnerHTML={{ __html: gildKeyframes }} />
        <Toaster richColors position="bottom-right" />
        <PostHogProvider>{children}</PostHogProvider>
        <Script
          id="sw-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .catch(function(err) {
                      console.error('SW registration failed:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
