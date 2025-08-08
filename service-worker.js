self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('lego-bouwspel-v2').then((cache) => {
      return cache.addAll([
        './',
        './index.html',
        './styles.css',
        './script.js',
        './words.json',
        './manifest.webmanifest',
        './icons/icon-192.png',
        './icons/icon-512.png',
        // images are cached on first load dynamically
      ]);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => {
      return resp || fetch(e.request).then(networkResp => {
        // Cache-aside for images
        if (e.request.url.includes('/images/')) {
          const copy = networkResp.clone();
          caches.open('lego-bouwspel-v2').then(cache => cache.put(e.request, copy));
        }
        return networkResp;
      });
    })
  );
});
