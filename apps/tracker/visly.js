/**
 * Visly — Hardened telemetry client (Standalone)
 * Loads via <script> tag and batches events to backend
 *
 * Design goals:
 * - Zero dependencies
 * - Event-driven (not polling-heavy)
 * - Safe on page unload
 * - Resume-friendly, production-shaped
 */
(function (window, document) {
    "use strict";

    /* ------------------------------------------------------------------
     * 1. Utilities
     * ------------------------------------------------------------------ */

    // Generate a stable UUID (crypto-safe if available)
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

    // LocalStorage helpers (fail-safe)
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
        flushInterval: 8000, // ms
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
        return; // hard stop — project must be defined
    }

    /* ------------------------------------------------------------------
     * 3. Identity
     * ------------------------------------------------------------------ */

    // Persist session & user across reloads
    var sessionId = getStorage("visly_s") || uuid();
    var userId = getStorage("visly_u") || uuid();

    setStorage("visly_s", sessionId);
    setStorage("visly_u", userId);

    /* ------------------------------------------------------------------
     * 4. Event Buffer
     * ------------------------------------------------------------------ */

    var buffer = [];

    /**
     * Flush events to backend
     * - Uses sendBeacon ONLY for page unload
     * - Falls back to fetch otherwise
     */
    function flush(useBeacon) {
        if (buffer.length === 0) return;

        // Take up to maxBatch events
        var batch = buffer.splice(0, DEFAULTS.maxBatch);

        // NDJSON payload (fast to parse server-side)
        var body = batch
            .map(function (e) {
                return JSON.stringify(e);
            })
            .join("\n");

        // Beacon is best-effort only (unload / background)
        if (useBeacon && navigator.sendBeacon) {
            try {
                if (navigator.sendBeacon(config.endpoint, body)) return;
            } catch { }
        }

        // Normal fetch for active page
        fetch(config.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/x-ndjson" },
            body: body,
            keepalive: true
        }).catch(function () {
            // Re-queue on failure (bounded)
            buffer = batch.concat(buffer).slice(0, DEFAULTS.maxQueueSize);
        });
    }

    /* ------------------------------------------------------------------
     * 5. Event API
     * ------------------------------------------------------------------ */

    function track(eventName, props) {
        if (!eventName) return;

        try {
            buffer.push({
                event: eventName,
                event_time: Date.now(),
                project_id: config.projectId,

                // Context
                url: window.location.href,
                path: window.location.pathname,
                referrer: document.referrer || null,
                ua: navigator.userAgent,

                // Identity
                session_id: sessionId,
                user_id: userId,

                // Custom props
                ...(props || {})
            });

            // Hard flush if batch limit reached
            if (buffer.length >= DEFAULTS.maxBatch) {
                flush();
            }
        } catch (e) {
            if (config.debug) console.error("[visly]", e);
        }
    }

    /* ------------------------------------------------------------------
     * 6. Background Flush Loop
     * ------------------------------------------------------------------ */

    /**
     * IMPORTANT:
     * This ensures events NEVER get stuck if traffic is low.
     * This is the main fix vs your previous version.
     */
    setInterval(function () {
        flush();
    }, DEFAULTS.flushInterval);

    /* ------------------------------------------------------------------
     * 7. Auto Instrumentation
     * ------------------------------------------------------------------ */

    try {
        // Initial pageview
        track("pageview");

        // Click tracking via delegation
        document.addEventListener(
            "click",
            function (e) {
                var el =
                    e.target.closest && e.target.closest("[data-va]");
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

        // Flush safely on page hide / close
        document.addEventListener("visibilitychange", function () {
            if (document.visibilityState === "hidden") {
                flush(true);
            }
        });
    } catch { }

    /* ------------------------------------------------------------------
     * 8. Public API
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
