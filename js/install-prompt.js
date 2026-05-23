// PWA install prompt + service worker registration.
// Extracted from inline <script> to satisfy Silk SES (no inline scripts allowed).
(function () {
    'use strict';

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(function () { /* registration failures are non-fatal */ });
    }

    var deferredPrompt = null;
    var installBanner = document.getElementById('install-banner');
    var installBtn = document.getElementById('install-btn');
    var installText = document.getElementById('install-text');
    var installDismiss = document.getElementById('install-dismiss');
    var dismissed = sessionStorage.getItem('bbg_install_dismissed');

    if (!installBanner || !installBtn) return;

    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        deferredPrompt = e;
        if (!dismissed && !window.matchMedia('(display-mode: standalone)').matches) {
            installBanner.style.display = 'flex';
        }
    });

    window.addEventListener('load', function () {
        var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (isStandalone || dismissed) return;
        setTimeout(function () {
            if (deferredPrompt || installBanner.style.display !== 'none') return;
            var ua = navigator.userAgent.toLowerCase();
            var dismissHandler = function () {
                installBanner.style.display = 'none';
                sessionStorage.setItem('bbg_install_dismissed', '1');
            };
            if (ua.indexOf('silk') !== -1) {
                installText.textContent = 'Tap the menu then "Add to Home Screen" for full-screen play!';
                installBtn.textContent = 'Got it';
                installBtn.addEventListener('click', dismissHandler);
            } else if (ua.indexOf('firefox') !== -1) {
                installText.textContent = 'Tap the menu then "Install" for full-screen play!';
                installBtn.textContent = 'Got it';
                installBtn.addEventListener('click', dismissHandler);
            } else if (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) {
                installText.textContent = 'Tap Share then "Add to Home Screen" for full-screen play!';
                installBtn.textContent = 'Got it';
                installBtn.addEventListener('click', dismissHandler);
            } else {
                return;
            }
            installBanner.style.display = 'flex';
        }, 2000);
    });

    installBtn.addEventListener('click', function () {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function () {
                deferredPrompt = null;
                installBanner.style.display = 'none';
            });
        }
    });

    if (installDismiss) {
        installDismiss.addEventListener('click', function () {
            installBanner.style.display = 'none';
            sessionStorage.setItem('bbg_install_dismissed', '1');
        });
    }
})();
