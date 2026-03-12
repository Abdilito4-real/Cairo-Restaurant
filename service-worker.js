// ═══════════════════════════════════════════════════
// CAIRO RESTAURANT — SERVICE WORKER
// ═══════════════════════════════════════════════════
const CACHE_NAME = 'cairo-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/menu.html',
  '/reservations.html',
  '/about.html',
  '/admin.html',
  '/styles.css',
  '/menu.js',
  '/admin.js',
  '/supabase.js',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || networkFetch;
    })
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : { title: 'Cairo Restaurant', body: 'New notification' };
  e.waitUntil(
    self.registration.showNotification(data.title || 'Cairo Restaurant', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'cairo-notification',
      requireInteraction: true,
      data: data
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/admin.html'));
});

self.addEventListener('message', e => {
  if (!e.data) return;
  if (e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (e.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = e.data;
    self.registration.showNotification(title || 'Cairo Restaurant', {
      body: body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'cairo-order',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        { action: 'view', title: 'View Order' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});
