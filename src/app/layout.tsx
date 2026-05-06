import type { Metadata } from 'next';
import Script from 'next/script';
import { Bricolage_Grotesque, Inter, JetBrains_Mono, Gochi_Hand } from 'next/font/google';
import { gildKeyframes } from '@/components/gild/styles';

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

const gochiHand = Gochi_Hand({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-gochi',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gild',
  description: 'Premium community platform',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gild',
  },
  icons: {
    apple: '/icons/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#111111',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${inter.variable} ${jetbrains.variable} ${gochiHand.variable}`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: gildKeyframes }} />
      </head>
      <body style={{ margin: 0, fontFamily: 'var(--font-inter), system-ui, sans-serif', background: '#fff' }}>
        {children}
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
