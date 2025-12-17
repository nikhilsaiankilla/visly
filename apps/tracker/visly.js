/**
 * Visly — Hardened telemetry client (Standalone)
 * Loads via <script> tag and batches events to backend
 *
 * Design goals:
 * - Zero dependencies
 * - Event-driven + smart heartbeat
 * - Safe on page unload
 * - Resume-friendly, production-shaped
 */
(function (window, document) {
    "use strict";

    /* ------------------------------------------------------------------
     * 1. Utilities
     * ------------------------------------------------------------------ */

    function uuid() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return (
            "visly-" +
            Date.now().toString(36) +
            Math.random().toString(36).slice(2)
        );
    }

    function getStorage(key) {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    }

    function setStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch { }
    }

    /* ------------------------------------------------------------------
     * 2. Configuration
     * ------------------------------------------------------------------ */

    var script = document.currentScript;

    var DEFAULTS = {
        endpoint: "https://visly-qrpb.onrender.com/e",
        flushInterval: 8000,
        maxBatch: 40,
        maxQueueSize: 1000
    };

    var config = {
        projectId: script && script.getAttribute("data-project-id"),
        endpoint:
            (script && script.getAttribute("data-endpoint")) ||
            DEFAULTS.endpoint,
        debug: script && script.getAttribute("data-debug") === "true",
        captureText:
            script && script.getAttribute("data-capture-text") === "true"
    };

    if (!config.projectId) {
        if (config.debug) {
            console.warn("[visly] missing data-project-id");
        }
        return;
    }

    /* ------------------------------------------------------------------
     * 3. Identity
     * ------------------------------------------------------------------ */

    var sessionId = getStorage("visly_s") || uuid();
    var userId = getStorage("visly_u") || uuid();

    setStorage("visly_s", sessionId);
    setStorage("visly_u", userId);

    /* ------------------------------------------------------------------
     * 4. Buffer
     * ------------------------------------------------------------------ */

    var buffer = [];

    function flush(useBeacon) {
        if (buffer.length === 0) return;

        var batch = buffer.splice(0, DEFAULTS.maxBatch);

        var body = batch
            .map(function (e) {
                return JSON.stringify(e);
            })
            .join("\n");

        // sendBeacon ONLY for unload
        if (useBeacon && navigator.sendBeacon) {
            try {
                if (navigator.sendBeacon(config.endpoint, body)) return;
            } catch { }
        }

        fetch(config.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/x-ndjson" },
            body: body,
            keepalive: true
        }).catch(function () {
            buffer = batch.concat(buffer).slice(0, DEFAULTS.maxQueueSize);
        });
    }

    /* ------------------------------------------------------------------
     * 5. Track API
     * ------------------------------------------------------------------ */

    function track(eventName, props) {
        if (!eventName) return;

        buffer.push({
            event: eventName,
            event_time: Date.now(),
            project_id: config.projectId,

            // context
            url: window.location.href,
            path: window.location.pathname,
            referrer: document.referrer || null,
            ua: navigator.userAgent,

            // identity
            session_id: sessionId,
            user_id: userId,

            ...(props || {})
        });

        if (buffer.length >= DEFAULTS.maxBatch) {
            flush();
        }
    }

    /* ------------------------------------------------------------------
     * 6. Background Flush Loop (safety net)
     * ------------------------------------------------------------------ */

    setInterval(function () {
        flush();
    }, DEFAULTS.flushInterval);

    /* ------------------------------------------------------------------
     * 7. SMART HEARTBEAT (THIS IS THE KEY)
     * ------------------------------------------------------------------ */

    var heartbeatTimer = null;

    function startHeartbeat() {
        if (heartbeatTimer) return;

        heartbeatTimer = setInterval(function () {
            track("heartbeat", {
                visibility: document.visibilityState
            });
        }, DEFAULTS.flushInterval);
    }

    function stopHeartbeat() {
        if (!heartbeatTimer) return;
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
    }

    /* ------------------------------------------------------------------
     * 8. Auto Instrumentation
     * ------------------------------------------------------------------ */

    try {
        // Pageview
        track("pageview");

        // Start heartbeat if visible
        if (document.visibilityState === "visible") {
            startHeartbeat();
        }

        // Click tracking
        document.addEventListener(
            "click",
            function (e) {
                var el = e.target.closest && e.target.closest("[data-va]");
                if (!el) return;

                var payload = {
                    el_name: el.getAttribute("data-va"),
                    el_tag: el.tagName.toLowerCase(),
                    el_href: el.href || null
                };

                if (config.captureText) {
                    payload.el_text = (el.innerText || "").slice(0, 100);
                }

                track("click", payload);
            },
            true
        );

        // Visibility handling
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden") {
                stopHeartbeat();
                flush(true);
            } else {
                startHeartbeat();
            }
        });
    } catch { }

    /* ------------------------------------------------------------------
     * 9. Public API
     * ------------------------------------------------------------------ */

    window.visly = {
        track: track,
        identify: function (id) {
            if (!id) return;
            userId = id;
            setStorage("visly_u", id);
        }
    };
})(window, document);
