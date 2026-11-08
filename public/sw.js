/* RapidLearn PWA service worker. API responses are deliberately never cached. */
const CACHE_PREFIX = "rapidlearn-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const APP_SHELL = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/rapidlearn-192.png",
  "/icons/rapidlearn-512.png",
  "/icons/rapidlearn-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Keep all application APIs online-only: never serve stale AI, quiz or topic data.
  if (url.pathname.startsWith("/api/")) return;

  // Cache immutable Next.js build assets and app icons for quicker repeat launches.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      }),
    );
    return;
  }

  // Network-first navigation keeps the deployed Next.js app fresh and falls back
  // to the last cached home page (or the lightweight offline page) when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok && (url.pathname === "/" || url.pathname === "/offline.html")) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(url.pathname, response.clone());
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match(url.pathname)) || (await cache.match("/")) || (await cache.match("/offline.html"));
        }),
    );
    return;
  }

  // The web manifest is safe to cache; other requests remain network-first.
  if (url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) await (await caches.open(CACHE_NAME)).put(request, response.clone());
        return response;
      }),
    );
  }
});
