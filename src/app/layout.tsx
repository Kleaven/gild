import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Bricolage_Grotesque, Inter, JetBrains_Mono, Gochi_Hand, Outfit } from 'next/font/google';
import { gildKeyframes } from '@/components/gild';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
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

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
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
    <html lang="en" className={`${bricolage.variable} ${inter.variable} ${jetbrains.variable} ${gochi.variable} ${outfit.variable}`}>
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
