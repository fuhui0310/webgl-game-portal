const CACHE_NAME = "unity-webgl-assets-v1";

function isUnityAsset(url) {
  if (url.pathname.startsWith("/StreamingAssets/")) {
    return true;
  }

  if (url.hostname.includes("amazonaws.com") || url.hostname.includes("s3.")) {
    return true;
  }

  return /\.(data|wasm|bundle|unityweb|gz|framework\.js|loader\.js)(\.gz)?$/.test(
    url.pathname,
  );
}

function cacheKeyFor(url) {
  return `${url.origin}${url.pathname}`;
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (!isUnityAsset(url)) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const key = new Request(cacheKeyFor(url));
      const cached = await cache.match(key);
      if (cached) {
        return cached;
      }

      const response = await fetch(event.request);
      if (response.ok) {
        try {
          await cache.put(key, response.clone());
        } catch {
          // Cross-origin responses without CORS cannot be stored.
        }
      }
      return response;
    })(),
  );
});
