// Blake Boys Gaming Hub — Service Worker v3.0
const CACHE_NAME = 'bbg-hub-v8';
const ASSETS = [
    './',
    './index.html',
    './css/hub.css',
    './css/hub-features.css',
    './css/shared/design-system.css',
    './css/shared/fonts/fredoka-one.woff2',
    './css/shared/fonts/nunito-regular.woff2',
    './css/shared/fonts/nunito-semibold.woff2',
    './js/otb-config.js',
    './js/ecosystem.js',
    './js/animations.js',
    './js/shop.js',
    './js/trophies.js',
    './js/challenges.js',
    './js/progressmap.js',
    './js/reportcard.js',
    './js/pet.js',
    './js/hub.js',
    './assets/bbg-logo.png',
    './assets/banner-thinkfast.png',
    './assets/banner-wordmine.png',
    './assets/banner-rhythmblast.png',
    './assets/banner-potionlab.png',
    './assets/banner-spidey.png',
    './manifest.json'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
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
    e.respondWith(
        caches.match(e.request).then(cached => {
            const fetchPromise = fetch(e.request).then(response => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
                }
                return response;
            }).catch(() => cached);
            return cached || fetchPromise;
        })
    );
});
