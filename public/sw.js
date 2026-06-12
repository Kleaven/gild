// Bumped 2026-06-12 (v3): HTML pages were precached cache-first — users were
// haunted by stale landing/sign-in/sign-up UI across deploys until a hard
// refresh. Pages are NEVER cached now; only truly static assets are.
const CACHE_NAME = 'gild-shell-v3';

// Static assets only. HTML documents must never appear here — they change
// every deploy and a cache-first document resurrects dead UI.
const SHELL_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Routes that must NEVER be served from cache
// Auth, API, and Supabase calls must always hit the network
const NETWORK_ONLY_PATTERNS = [
  /^\/api\//,
  /^\/auth\//,
  /supabase\.co/,
  /stripe\.com/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests
  if (request.method !== 'GET') return;

  // 2. Network-only for auth/API/external
  const isNetworkOnly = NETWORK_ONLY_PATTERNS.some((pattern) =>
    pattern.test(url.pathname) || pattern.test(url.href)
  );
  if (isNetworkOnly) return;

  // 3. Cache-first for shell assets, network-first for everything else
  const isShell = SHELL_ASSETS.includes(url.pathname);

  if (isShell) {
    // Cache-first: return cached version, revalidate in background
    event.respondWith(
      caches.match(request).then(
        (cached) => cached ?? fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
      )
    );
  } else if (request.mode === 'navigate' || request.destination === 'document') {
    // Documents: network only, never cached. A cached page is a stale page.
    return;
  } else {
    // Other subresources: network-first with cache fallback (offline help).
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? Response.error()))
    );
  }
});
