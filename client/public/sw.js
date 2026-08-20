/* CachePDF app-shell service worker. It caches only public application resources; selected files
   are never read, persisted, or transmitted by this worker. */
const CACHE = "cachepdf-shell-v1";
const CORE = [
  "/", "/index.html", "/manifest.webmanifest", "/sw.js",
  "/manus-storage/cachepdf-app-icon-cyan_a023b6dd.svg",
  "/manus-storage/cachepdf-app-icon-cyan(1)_e3f8f638.svg",
  "/manus-storage/pasted_file_xAB1Wk_cachepdf-app-icon-cyan_c84f0276.svg",
  "/manus-storage/cachepdf-app-icon-dark_b173d3f4.svg",
  "/manus-storage/cachepdf-favicon_4147f495.svg",
  "/manus-storage/cachepdf-favicon(1)_e0e89a79.svg",
  "/manus-storage/cachepdf-horizontal-dark_e23da26a.svg",
  "/manus-storage/cachepdf-horizontal-dark(1)_c683a4a3.svg",
  "/manus-storage/cachepdf-horizontal-light_7626905c.svg",
  "/manus-storage/cachepdf-mark-dark_5d8e4459.svg",
  "/manus-storage/cachepdf-mark-light_bb8013ee.svg",
  "/manus-storage/cachepdf-monogram-cyan_2f63f2a5.svg",
  "/manus-storage/cachepdf-monogram-cyan(1)_b9d71293.svg",
  "/manus-storage/cachepdf-wordmark-dark_6e1c68f6.svg",
  "/manus-storage/cachepdf-wordmark-dark(1)_a06c6b4f.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(CORE.map(async (url) => {
    try { const response = await fetch(url); if (response.ok || response.type === "opaque") await cache.put(url, response.clone()); } catch { /* offline readiness remains best-effort for optional resources */ }
  }))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHEPDF_CACHE_URLS") return;
  const urls = Array.isArray(event.data.urls) ? event.data.urls.filter((url) => typeof url === "string") : [];
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(urls.map(async (url) => {
    try { const response = await fetch(url, { credentials: "same-origin" }); if (response.ok) await cache.put(url, response.clone()); } catch { /* cache what is available; offline fallbacks remain safe */ }
  }))));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put("/index.html", copy)); return response;
    }).catch(() => caches.match("/index.html")));
    return;
  }
  if (url.origin !== self.location.origin) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response;
  })));
});
