import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gild-flax.vercel.app';

// Public, unauthenticated routes only. Community pages sit behind auth/join
// gates, so they stay out of the sitemap until public landing pages exist.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/sign-up`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/sign-in`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
