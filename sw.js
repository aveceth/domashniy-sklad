const CACHE = 'home-pantry-static-v041';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './db.js',
  './expiry-rules.js',
  './cloud.js',
  './cloud-config.js',
  './inventory-utils.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Устанавливаем новые файлы и активируем обновление.
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    // При обновлении ждём нажатия кнопки «Обновить»; при первой установке активируем сразу.
    if (!self.registration.active) await self.skipWaiting();
  })());
});

// Удаляем устаревший кеш.
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();

    await Promise.all(
      keys
        .filter(key =>
          key.startsWith('home-pantry-static-') &&
          key !== CACHE
        )
        .map(key => caches.delete(key))
    );

    await self.clients.claim();
  })());
});

// При наличии интернета получаем свежие файлы.
// При отсутствии интернета используем кеш.
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request, {
        cache: 'no-store'
      });

      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }

      return response;
    } catch (error) {
      const cached = await caches.match(request);
      if (cached) return cached;

      if (request.mode === 'navigate') {
        const fallback = await caches.match('./index.html');
        if (fallback) return fallback;
      }

      return Response.error();
    }
  })());
});

// Совместимость с кнопкой обновления.
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Получение фоновых push-уведомлений.
self.addEventListener('push', event => {
  let payload = {
    title: 'Домашний склад',
    body: 'Проверьте сроки хранения продуктов.'
  };

  try {
    payload = {
      ...payload,
      ...(event.data?.json() || {})
    };
  } catch (error) {}

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      tag: payload.tag || 'pantry-expiry',
      data: { url: './' }
    })
  );
});

// Открытие приложения по нажатию на уведомление.
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(windows => {
      if (windows.length) {
        return windows[0].focus();
      }

      return clients.openWindow(
        event.notification.data?.url || './'
      );
    })
  );
});
