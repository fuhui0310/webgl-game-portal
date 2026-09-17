const version = new URL(self.location.href).searchParams.get("v") || "v1";
const CACHE_NAME = `unity-webgl-assets-${version}`;

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
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter(
            (name) =>
              name.startsWith("unity-webgl-assets-") && name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
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

      const response = await fetch(event.request, { cache: "reload" });
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
