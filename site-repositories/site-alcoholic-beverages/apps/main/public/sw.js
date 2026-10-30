/* Transition worker for the legacy root site.
   It has no fetch handler. Its only job is to remove the old hejiu-v1 cache,
   stop controlling pages and unregister itself. New visitors do not register it. */
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    (async function () {
      var keys = await caches.keys();
      await Promise.all(
        keys
          .filter(function (name) {
            return name === 'hejiu-v1' || name.indexOf('hejiu-') === 0;
          })
          .map(function (name) {
            return caches.delete(name);
          }),
      );
      await self.clients.claim();
      await self.registration.unregister();
    })(),
  );
});
