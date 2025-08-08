self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('lego-bouwspel-v3').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './styles.css',
        './script.js',
        './words.json',
        './manifest.webmanifest',
        './icons/icon-192.png',
        './icons/icon-512.png',
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => {
      return resp || fetch(e.request).then(networkResp => {
        if (e.request.url.includes('/images/')) {
          const copy = networkResp.clone();
          caches.open('lego-bouwspel-v3').then(cache => cache.put(e.request, copy));
        }
        return networkResp;
      });
    })
  );
});
