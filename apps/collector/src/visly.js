/**
 * Visly — Hardened production telemetry client (Standalone)
 * Host: Supabase Storage
 */
(function (window, document) {
    "use strict";

    // 1. Helpers
    function uuid() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return "visly-" + Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
    function getStorage(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function setStorage(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }

    // 2. Config
    var script = document.currentScript;
    var DEFAULTS = {
        endpoint: "http://localhost:3001/e", // Your fastify backend
        flushInterval: 8000,
        maxBatch: 40,
        maxQueueSize: 1000,
        requestTimeoutMs: 10000
    };

    var config = {
        projectId: script ? script.getAttribute("data-project-id") : null,
        endpoint: (script && script.getAttribute("data-endpoint")) || DEFAULTS.endpoint,
        debug: (script && script.getAttribute("data-debug") === "true"),
        captureText: (script && script.getAttribute("data-capture-text") === "true")
    };

    var session = getStorage("visly_s") || uuid();
    var user = getStorage("visly_u") || uuid();
    var buffer = [];
    var timer = null;
    var prefix = "[visly]";

    // Initialize Storage
    setStorage("visly_s", session);
    setStorage("visly_u", user);

    if (!config.projectId) {
        if (config.debug) console.warn(prefix + " missing data-project-id");
        return;
    }

    // 3. Core Logic
    function flush(useBeacon) {
        if (buffer.length === 0) return;

        var batch = buffer.splice(0, DEFAULTS.maxBatch);
        var body = batch.map(function (e) { return JSON.stringify(e); }).join("\n");

        // Try Beacon (best for page unload)
        if (useBeacon && navigator.sendBeacon) {
            try {
                if (navigator.sendBeacon(config.endpoint, body)) return;
            } catch (e) { /* ignore beacon errors */ }
        }

        // Fallback to fetch
        fetch(config.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/x-ndjson" },
            body: body,
            keepalive: true
        }).catch(function () {
            // Retry strategy: put them back at the front of the queue
            buffer = batch.concat(buffer).slice(0, DEFAULTS.maxQueueSize);
        });
    }

    function track(name, props) {
        if (!name) return;
        try {
            buffer.push({
                event: name,
                event_time: Date.now(),
                project_id: config.projectId,
                path: window.location.pathname,
                url: window.location.href,
                referrer: document.referrer || null,
                session_id: session,
                user_id: user,
                ua: navigator.userAgent,
                ...props
            });

            if (buffer.length >= DEFAULTS.maxBatch) flush();
            else if (!timer) {
                timer = setTimeout(function () { timer = null; flush(); }, DEFAULTS.flushInterval);
            }
        } catch (e) { if (config.debug) console.error(e); }
    }

    // 4. Listeners
    try {
        // Pageview
        track("pageview");

        // Click Tracking (delegated)
        document.addEventListener("click", function (e) {
            var t = e.target.closest ? e.target.closest("[data-va]") : e.target;
            if (t && t.getAttribute && t.getAttribute("data-va")) {
                var p = {
                    el_name: t.getAttribute("data-va"),
                    el_tag: t.tagName.toLowerCase(),
                    el_href: t.href
                };
                if (config.captureText) p.el_text = (t.innerText || "").slice(0, 100);
                track("click", p);
            }
        }, true);

        // Unload
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden") flush(true);
        });
    } catch (e) { }

    // 5. Expose
    window.visly = { track: track, identify: function (id) { user = id; setStorage("visly_u", id); } };

})(window, document);