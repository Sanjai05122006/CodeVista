/* Cleanup service worker.
 *
 * CodeVista does not ship a PWA runtime, but some browsers can keep a stale
 * `/sw.js` registration around from earlier builds or local testing.
 *
 * This file exists to satisfy that request, clear any leftover caches, and
 * unregister itself so the browser stops asking for `/sw.js`.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();

      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
      await self.registration.unregister();
    })()
  );
});
