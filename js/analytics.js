/* ============================================
   BBG Hub — Structured Analytics
   Tiny event logger. For now it just writes to
   console as `[bbg.ev]` JSON, but the surface is
   stable so a future paid analytics provider can
   hook in without touching every call site.

   Call signature: BBGAnalytics.event(name, props)
   ============================================ */
(function () {
    'use strict';

    if (window.BBGAnalytics) return;

    // Lazy session id so we can correlate events from one play session
    // without writing anything to disk.
    var sessionId = null;
    function _sid() {
        if (!sessionId) {
            try {
                if (window.crypto && window.crypto.getRandomValues) {
                    var buf = new Uint8Array(8);
                    window.crypto.getRandomValues(buf);
                    sessionId = Array.from(buf).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
                } else {
                    sessionId = 'ses_' + Math.random().toString(36).slice(2, 10);
                }
            } catch (_) {
                sessionId = 'ses_' + Math.random().toString(36).slice(2, 10);
            }
        }
        return sessionId;
    }

    function _activeProfileId() {
        try {
            if (window.ProfileManager && ProfileManager.getActiveProfileId) {
                return ProfileManager.getActiveProfileId();
            }
        } catch (_) {}
        return null;
    }

    function _safeStringify(obj) {
        try { return JSON.stringify(obj); }
        catch (_) { return '{"event":"ev_stringify_failed"}'; }
    }

    function event(name, props) {
        if (!name) return;
        var payload = Object.assign(
            { t: Date.now(), name: String(name), sid: _sid(), pid: _activeProfileId() },
            props || {}
        );
        try {
            // Single-line JSON. Easy to grep, easy to ship to a backend later.
            console.log('[bbg.ev]', _safeStringify(payload));
        } catch (_) { /* never throw from analytics */ }
    }

    window.BBGAnalytics = {
        event: event,
        sessionId: _sid
    };
})();
