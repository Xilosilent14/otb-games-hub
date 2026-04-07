// Blake Boys Gaming — Unified Service Worker
// Covers Hub + all games under one origin

const VERSION = '1';
const CACHE_SHARED = 'bbg-shared-v' + VERSION;
const CACHE_HUB = 'bbg-hub-v' + VERSION;
const CACHE_GAMES = {
    '/thinkfast/': 'bbg-thinkfast-v' + VERSION,
    '/wordmine/': 'bbg-wordmine-v' + VERSION,
    '/rhythmblast/': 'bbg-rhythmblast-v' + VERSION,
    '/creaturecards/': 'bbg-creaturecards-v' + VERSION,
    '/spidey/': 'bbg-spidey-v' + VERSION,
    '/potionlab/': 'bbg-potionlab-v' + VERSION
};

const ALL_CACHES = [CACHE_SHARED, CACHE_HUB, ...Object.values(CACHE_GAMES)];

// Shared assets precached on install
const SHARED_ASSETS = [
    '/css/shared/design-system.css',
    '/css/shared/fonts/fredoka-one.woff2',
    '/css/shared/fonts/nunito-regular.woff2',
    '/css/shared/fonts/nunito-semibold.woff2',
    '/js/otb-config.js',
    '/js/ecosystem.js',
    '/assets/bbg-logo.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json'
];

// Hub assets precached on install
const HUB_ASSETS = [
    '/',
    '/index.html',
    '/css/hub.css',
    '/css/hub-features.css',
    '/js/animations.js',
    '/js/shop.js',
    '/js/trophies.js',
    '/js/challenges.js',
    '/js/progressmap.js',
    '/js/reportcard.js',
    '/js/pet.js',
    '/js/hub.js',
    '/assets/banner-thinkfast.png',
    '/assets/banner-wordmine.png',
    '/assets/banner-rhythmblast.png',
    '/assets/banner-creaturecards.png'
];

// Determine which cache to use for a given URL
function getCacheName(url) {
    const path = new URL(url).pathname;

    // Shared assets
    if (path.startsWith('/css/shared/') || path.startsWith('/js/ecosystem') || path.startsWith('/js/otb-config') || path.startsWith('/icons/') || path === '/manifest.json') {
        return CACHE_SHARED;
    }

    // Game-specific
    for (const [prefix, cache] of Object.entries(CACHE_GAMES)) {
        if (path.startsWith(prefix)) return cache;
    }

    // Everything else is Hub
    return CACHE_HUB;
}

// Install: precache shared + hub assets
self.addEventListener('install', e => {
    e.waitUntil(
        Promise.all([
            caches.open(CACHE_SHARED).then(c => c.addAll(SHARED_ASSETS)),
            caches.open(CACHE_HUB).then(c => c.addAll(HUB_ASSETS))
        ])
    );
    self.skipWaiting();
});

// Activate: clean up old caches (including legacy per-game ones)
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(k => !ALL_CACHES.includes(k))
                    .map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Fetch: network-first for HTML, cache-first for everything else
self.addEventListener('fetch', e => {
    const url = e.request.url;
    if (!url.startsWith('http')) return;

    const isHTML = e.request.headers.get('accept')?.includes('text/html') ||
                   url.endsWith('.html') || url.endsWith('/');

    if (isHTML) {
        // Network-first for HTML (always get fresh content)
        e.respondWith(
            fetch(e.request)
                .then(resp => {
                    const clone = resp.clone();
                    const cacheName = getCacheName(url);
                    caches.open(cacheName).then(c => c.put(e.request, clone));
                    return resp;
                })
                .catch(() => caches.match(e.request))
        );
    } else {
        // Cache-first for static assets
        e.respondWith(
            caches.match(e.request).then(cached => {
                if (cached) return cached;
                return fetch(e.request).then(resp => {
                    const clone = resp.clone();
                    const cacheName = getCacheName(url);
                    caches.open(cacheName).then(c => c.put(e.request, clone));
                    return resp;
                });
            })
        );
    }
});
