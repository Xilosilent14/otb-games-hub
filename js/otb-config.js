/**
 * OTB Games — URL Configuration
 * Detects environment (local dev vs Cloudflare Pages) and sets game URLs.
 * Include this script before any code that references game URLs.
 */
const OTBConfig = (() => {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';

    // Production URLs (shutterbuzzent.com subdomains)
    const PRODUCTION_URLS = {
        hub: 'https://otbgames.shutterbuzzent.com',
        'think-fast': 'https://thinkfast.shutterbuzzent.com',
        'word-mine': 'https://wordmine.shutterbuzzent.com',
        'rhythm-blast': 'https://rhythmblast.shutterbuzzent.com'
    };

    // Local dev URLs
    const LOCAL_URLS = {
        hub: 'http://localhost:8082',
        'think-fast': 'http://localhost:8080',
        'word-mine': 'http://localhost:8081',
        'rhythm-blast': 'http://localhost:8083'
    };

    const urls = isLocal ? LOCAL_URLS : PRODUCTION_URLS;

    return {
        isLocal,
        urls,
        getGameUrl(gameId) {
            return urls[gameId] || '#';
        },
        getHubUrl() {
            return urls.hub;
        }
    };
})();
