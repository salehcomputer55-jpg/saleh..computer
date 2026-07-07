// সালেহ কম্পিউটার — সার্ভিস ওয়ার্কার
// এটা অ্যাপের ফাইলগুলো ডিভাইসে সংরক্ষণ করে রাখে, যাতে ইন্টারনেট না থাকলেও অ্যাপ খোলা যায়।
// (ইন্টারনেট ছাড়া নতুন ডাটা ক্লাউডে সেভ হবে না, কিন্তু অ্যাপ খুলবে ও আগের ডাটা দেখা যাবে —
//  ডাটা মোবাইলেই লোকালি সেভ থাকে, ইন্টারনেট ফিরলে আবার ক্লাউডে সিঙ্ক হবে)

const CACHE_NAME = 'saleh-computer-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('SW precache warning:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// শুধু নিজের সাইটের GET রিকোয়েস্ট ক্যাশ করা হবে; ফায়ারবেস/ক্লাউড সিঙ্কের কল অক্ষত থাকবে
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
