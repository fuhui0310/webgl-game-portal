import { readFileSync } from "node:fs";
import path from "node:path";
import { createContext, runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const swSource = readFileSync(
  path.join(process.cwd(), "public/unity-cache-sw.js"),
  "utf8",
);

type CacheBucket = Map<string, Response>;

function loadServiceWorker(scriptUrl: string, fetchImpl: typeof fetch) {
  const listeners = new Map<string, (event: unknown) => void>();
  const buckets = new Map<string, CacheBucket>();

  const caches = {
    async open(name: string) {
      if (!buckets.has(name)) {
        buckets.set(name, new Map());
      }
      const bucket = buckets.get(name)!;
      return {
        match: async (request: Request) => bucket.get(request.url),
        put: async (request: Request, response: Response) => {
          bucket.set(request.url, response);
        },
      };
    },
    keys: async () => [...buckets.keys()],
    delete: async (name: string) => buckets.delete(name),
  };

  const self = {
    location: { href: scriptUrl },
    addEventListener: (type: string, listener: (event: unknown) => void) => {
      listeners.set(type, listener);
    },
    skipWaiting: vi.fn(async () => undefined),
    clients: { claim: vi.fn(async () => undefined) },
  };

  runInNewContext(swSource, createContext({ self, caches, fetch: fetchImpl, Request, URL }));

  return { listeners, buckets, self, caches };
}

function waitUntilEvent(listener: ((event: unknown) => void) | undefined) {
  if (!listener) {
    throw new Error("missing listener");
  }
  return new Promise<void>((resolve, reject) => {
    listener({
      waitUntil: (promise: Promise<unknown>) => {
        void promise.then(() => resolve(), reject);
      },
    });
  });
}

describe("unity-cache-sw", () => {
  it("uses a versioned cache name and deletes older Unity caches", async () => {
    const { listeners, buckets } = loadServiceWorker(
      "https://game.example/unity-cache-sw.js?v=new-build",
      vi.fn(),
    );
    buckets.set("unity-webgl-assets-old-build", new Map());
    buckets.set("unity-webgl-assets-new-build", new Map());
    buckets.set("other-cache", new Map());

    await waitUntilEvent(listeners.get("activate"));

    expect([...buckets.keys()].sort()).toEqual([
      "other-cache",
      "unity-webgl-assets-new-build",
    ]);
  });

  it("bypasses the HTTP cache when filling a missing Unity asset", async () => {
    const fetchImpl = vi.fn(async () => new Response("wasm", { status: 200 }));
    const { listeners, buckets } = loadServiceWorker(
      "https://game.example/unity-cache-sw.js?v=new-build",
      fetchImpl,
    );

    const request = new Request("https://bucket.s3.amazonaws.com/webgl/Build/MyGame.wasm.gz?X-Amz-Signature=old");
    await new Promise<Response>((resolve, reject) => {
      listeners.get("fetch")?.({
        request,
        respondWith: (promise: Promise<Response>) => {
          void promise.then(resolve, reject);
        },
      });
    });

    expect(fetchImpl).toHaveBeenCalledWith(request, { cache: "reload" });
    expect(
      buckets.get("unity-webgl-assets-new-build")?.has(
        "https://bucket.s3.amazonaws.com/webgl/Build/MyGame.wasm.gz",
      ),
    ).toBe(true);
  });
});
