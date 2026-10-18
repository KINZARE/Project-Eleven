const CACHE = "eleven-shell-development";
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))),
);
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE") self.skipWaiting();
});
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      const old = (await caches.keys()).filter(
        (key) => key.startsWith("eleven-shell-") && key !== CACHE,
      );
      await Promise.all(old.slice(0, -1).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).origin !== self.location.origin
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok)
            (await caches.open(CACHE)).put(request, response.clone());
          return response;
        } catch {
          const cache = await caches.open(CACHE);
          return (
            (await cache.match(request)) ||
            (await cache.match("/")) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok)
        (await caches.open(CACHE)).put(request, response.clone());
      return response;
    })(),
  );
});
