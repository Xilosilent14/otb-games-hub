/* ============================================
   BBG Hub — Global Error Boundary
   Loaded FIRST in the page so it can catch script
   errors and unhandled promise rejections from any
   other module. Logs structured events to console
   ([bbg.err]) so future analytics can ingest them.
   No alert popups. Never breaks UX.
   ============================================ */
(function () {
    'use strict';

    // Avoid double-install if the file ever gets imported twice
    if (window.__bbgErrorBoundaryInstalled) return;
    window.__bbgErrorBoundaryInstalled = true;

    function _safeStringify(obj) {
        try { return JSON.stringify(obj); }
        catch (_) { return '{"event":"err_stringify_failed"}'; }
    }

    function logErr(payload) {
        try {
            // Single line of structured JSON so we can grep + future-pipe.
            console.error('[bbg.err]', _safeStringify(payload));
        } catch (_) { /* never throw from the boundary */ }
    }

    window.onerror = function (msg, source, line, col, error) {
        logErr({
            event: 'unhandled',
            t: Date.now(),
            msg: String(msg || '').slice(0, 500),
            source: source ? String(source).slice(0, 200) : null,
            line: line || null,
            col: col || null,
            stack: error && error.stack ? String(error.stack).slice(0, 1000) : null,
            href: location && location.href ? location.href : null,
            ua: navigator && navigator.userAgent ? navigator.userAgent.slice(0, 200) : null
        });
        // Returning false lets the browser still log it. We don't want to
        // swallow errors entirely — devtools should still see them.
        return false;
    };

    window.addEventListener('unhandledrejection', function (event) {
        var reason = event && event.reason;
        var msg = '';
        var stack = null;
        if (reason && typeof reason === 'object') {
            msg = reason.message || '';
            stack = reason.stack || null;
        } else {
            msg = String(reason);
        }
        logErr({
            event: 'unhandled_promise',
            t: Date.now(),
            msg: String(msg).slice(0, 500),
            stack: stack ? String(stack).slice(0, 1000) : null,
            href: location && location.href ? location.href : null
        });
    });

    // Expose a manual report helper for modules that want to log a
    // non-fatal exception without bubbling it up.
    window.BBGErrorBoundary = {
        report: function (where, err, extra) {
            logErr(Object.assign({
                event: 'manual',
                t: Date.now(),
                where: String(where || 'unknown').slice(0, 100),
                msg: err && err.message ? String(err.message).slice(0, 500) : String(err).slice(0, 500),
                stack: err && err.stack ? String(err.stack).slice(0, 1000) : null
            }, extra || {}));
        }
    };
})();
