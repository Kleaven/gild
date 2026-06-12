import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gild-flax.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated and operational surfaces — nothing for crawlers here.
      disallow: ['/api/', '/admin/', '/onboarding/', '/settings/', '/auth/', '/reset-password'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
