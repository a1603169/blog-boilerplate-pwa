/*
 * Hand-written service worker.
 *
 * Replaces the Workbox bundle that `next-pwa` used to emit (sw.js +
 * workbox-*.js, ~250 kB committed to the repo). `next-pwa` is unmaintained and
 * does not support Next 15 / App Router, and the generated files had to be
 * regenerated and committed on every build.
 *
 * Strategy:
 *   navigations   -> network first, fall back to cache, then to the cached "/"
 *   build assets  -> cache first (content-hashed, so they never go stale)
 *   images/fonts  -> stale-while-revalidate
 * Everything else goes straight to the network.
 */

const VERSION = "v2";
const SHELL_CACHE = `shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;
const PAGE_CACHE = `pages-${VERSION}`;

/** Cached on install so the app opens offline straight after being added to the home screen. */
const SHELL_URLS = ["/", "/blog", "/favicon.ico", "/sh-dev-log.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      // Individually, so one failure does not abort the whole install.
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(new Request(url))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL_CACHE, ASSET_CACHE, PAGE_CACHE]);
      const names = await caches.keys();
      await Promise.all(names.filter((name) => !keep.has(name)).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

function isBuildAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isMedia(url) {
  return /\.(?:png|jpe?g|gif|svg|webp|avif|ico|woff2?)$/i.test(url.pathname);
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // Last resort for a navigation: the shell.
    const shell = await caches.open(SHELL_CACHE);
    const fallback = await shell.match("/");
    if (fallback) return fallback;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);

  return cached ?? refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache the worker itself or Next's dev/data endpoints.
  if (url.pathname === "/sw.js" || url.pathname.startsWith("/api/")) return;

  // /admin is authenticated and always changing. Caching it would both serve a
  // stale editor and leave signed-in HTML sitting in the cache.
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }

  if (isBuildAsset(url)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (isMedia(url)) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
  }
});
