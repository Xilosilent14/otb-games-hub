// Blake Boys Gaming — Unified Service Worker
// Covers Hub + all games under one origin

const VERSION = '3';
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
    '/js/auto-update.js',
    '/js/cloud-tts.js',
    '/assets/bbg-logo.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/manifest.json'
];

// Hub assets precached on install
const HUB_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/css/hub.css',
    '/css/hub-features.css',
    '/css/dashboard.css',
    '/js/error-boundary.js',
    '/js/analytics.js',
    '/js/animations.js',
    '/js/shop.js',
    '/js/trophies.js',
    '/js/challenges.js',
    '/js/progressmap.js',
    '/js/reportcard.js',
    '/js/pet.js',
    '/js/hub.js',
    '/js/dashboard.js',
    '/assets/banner-thinkfast.png',
    '/assets/banner-wordmine.png',
    '/assets/banner-rhythmblast.png',
    '/assets/banner-creaturecards.png'
];

// Determine which cache to use for a given URL
function getCacheName(url) {
    const path = new URL(url).pathname;

    // Shared assets
    if (path.startsWith('/css/shared/') || path.startsWith('/js/ecosystem') || path.startsWith('/js/otb-config') || path.startsWith('/js/auto-update') || path.startsWith('/js/cloud-tts') || path.startsWith('/icons/') || path === '/manifest.json') {
        return CACHE_SHARED;
    }

    // Game-specific
    for (const [prefix, cache] of Object.entries(CACHE_GAMES)) {
        if (path.startsWith(prefix)) return cache;
    }

    // Everything else is Hub
    return CACHE_HUB;
}

// Install: precache shared + hub assets (tolerant of missing files like offline.html)
self.addEventListener('install', e => {
    e.waitUntil(
        Promise.all([
            caches.open(CACHE_SHARED).then(c => Promise.all(
                SHARED_ASSETS.map(a => c.add(a).catch(() => null))
            )),
            caches.open(CACHE_HUB).then(c => Promise.all(
                HUB_ASSETS.map(a => c.add(a).catch(() => null))
            ))
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

// Message: allow pages to trigger immediate activation of a waiting SW
self.addEventListener('message', e => {
    if (e.data && e.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Fetch: network-first for HTML, cache-first for everything else
self.addEventListener('fetch', e => {
    const url = e.request.url;
    if (!url.startsWith('http')) return;

    // Don't cache version.json or analytics — always go to network
    const path = new URL(url).pathname;
    if (path === '/version.json' || path.startsWith('/api/')) return;

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
                .catch(() => {
                    // Offline: serve cached page, fall back to offline.html
                    return caches.match(e.request).then(cached => {
                        if (cached) return cached;
                        return caches.match('/offline.html').then(off => {
                            return off || new Response(
                                '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
                                '<style>body{font-family:sans-serif;background:#1a1a2e;color:#f0f0f0;' +
                                'display:flex;align-items:center;justify-content:center;height:100vh;' +
                                'margin:0;text-align:center;padding:20px;}h1{color:#ffd700;}</style>' +
                                '<h1>You are offline</h1><p>Reconnect and try again.</p>',
                                { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                            );
                        });
                    });
                })
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
                }).catch(() => cached);
            })
        );
    }
});
