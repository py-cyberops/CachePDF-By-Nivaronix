/* CachePDF app-shell service worker. It caches only public application resources; selected files
   are never read, persisted, or transmitted by this worker. */
const CACHE = "cachepdf-shell-v3";
const CORE = [
  "/", "/index.html", "/manifest.webmanifest", "/sw.js",
  "/branding/cachepdf-app-icon.svg",
  "/branding/cachepdf-app-mark.png",
  "/branding/cachepdf-horizontal-dark.svg",
  "/branding/cachepdf-horizontal-light.svg",
  "/branding/nivaronix-dark-extended.svg",
  "/branding/nivaronix-light-extended.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => Promise.all(CORE.map(async (url) => {
    try { const response = await fetch(url); if (response.ok || response.type === "opaque") await cache.put(url, response.clone()); } catch { /* offline readiness remains best-effort for optional resources */ }
  }))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("cachepdf-shell-") && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
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
  const isShellResource = url.pathname.startsWith("/assets/") || url.pathname.startsWith("/branding/") || ["/manifest.webmanifest", "/sw.js"].includes(url.pathname);
  if (!isShellResource) return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response;
  })));
});
