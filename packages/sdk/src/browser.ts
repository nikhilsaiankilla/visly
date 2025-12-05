/**
 * VislyClient — hardened production telemetry client
 *
 * Key goals:
 *  - Never throw to the host page (fail silently in production).
 *  - Keep telemetry best-effort: capture → queue → send.
 *  - Optional `debug` mode to surface internal errors during development.
 *
 * Usage:
 *  new VislyClient({ projectId: "proj", debug: true })
 *
 * Note: This file intentionally prefers defensive programming (try/catch everywhere).
 */

export type VislyOptions = {
    projectId?: string;      // optional now — client will noop if not provided
    endpoint?: string;
    flushInterval?: number;
    maxBatch?: number;
    sampleRate?: number;
    errorSampleRate?: number;
    captureText?: boolean;
    persistToIndexedDB?: boolean;
    maxQueueSize?: number;
    debug?: boolean;         // when true, internal errors are console.warn/console.error
    requestTimeoutMs?: number; // network timeout for fetch
};

type EventBase = {
    event: string;
    event_time: number;
    project_id?: string;
    path?: string;
    url?: string;
    referrer?: string | null;
    viewport_w?: number; viewport_h?: number;
    session_id?: string; user_id?: string;
    ua?: string;
    utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
    pageview_id?: string;
    [k: string]: unknown;
};

const DEFAULTS = {
    endpoint: "https://visly-qrpb.onrender.com/e",  // add the orginal url of the fastify
    flushInterval: 8000,
    maxBatch: 40,
    sampleRate: 1,
    errorSampleRate: 1,
    captureText: false,
    persistToIndexedDB: false,
    maxQueueSize: 1000,
    debug: false,
    requestTimeoutMs: 10_000
};

export class VislyClient {
    private cfg: Required<VislyOptions>;
    private sess = "";
    private user = "";
    private buf: EventBase[] = [];
    private timer: ReturnType<typeof setTimeout> | null = null;
    private inited = false;
    private enabled = true; // if false, client becomes no-op
    private readonly debugPrefix = "[visly]";

    // Controls whether network requests are allowed. By default network is only
    // enabled in production. Passing `debug: true` enables network calls in
    // development for debugging (per your request).
    private networkEnabled = false;

    constructor(opts: VislyOptions = {}) {
        // merge defaults in a try-catch to keep constructor safe
        try {
            this.cfg = { ...DEFAULTS, ...opts } as Required<VislyOptions>;
        } catch (e) {
            // unlikely, but ensure client doesn't break the host page
            // eslint-disable-next-line no-console
            console.warn(`${this.debugPrefix} init error, falling back to defaults`, e);
            this.cfg = DEFAULTS as Required<VislyOptions>;
        }

        // Determine environment: prefer explicit process.env.NODE_ENV when available
        let isProd = false;
        try {
            // Avoid referring to the bare `process` identifier (not available in browsers /
            // TypeScript without @types/node); use globalThis to safely detect Node env.
            const proc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
            isProd = !!(proc && proc.env && proc.env.NODE_ENV === 'production');
        } catch (_) { isProd = false; }

        // networkEnabled: only true in production or when user explicitly passes debug: true
        this.networkEnabled = isProd || !!this.cfg.debug;
        if (!this.networkEnabled && this.cfg.debug) {
            // If debug is set but network still disabled (shouldn't happen), warn
            try { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} network disabled by environment`); } catch (_) { }
        }

        // if no projectId provided, disable telemetry to avoid throwing or sending invalid data
        if (!this.cfg.projectId) {
            this.enabled = false;
            if (this.cfg.debug) {
                // eslint-disable-next-line no-console
                console.warn(`${this.debugPrefix} missing projectId — client disabled`);
            }
            // still set IDs to keep behavior consistent
            this.sess = this.safeUUID();
            this.user = this.safeUUID();
            return; // safe no-op client
        }

        // read or create persisting ids but wrap in try/catch in case storage access fails
        try {
            const s = typeof localStorage !== "undefined" ? localStorage.getItem("visly_s") : null;
            const u = typeof localStorage !== "undefined" ? localStorage.getItem("visly_u") : null;
            this.sess = (s as string) || this.safeUUID();
            this.user = (u as string) || this.safeUUID();
            try { if (typeof localStorage !== "undefined") localStorage.setItem("visly_s", this.sess); } catch (_) { }
            try { if (typeof localStorage !== "undefined") localStorage.setItem("visly_u", this.user); } catch (_) { }
        } catch (err) {
            // storage might be inaccessible (privacy mode) — keep in-memory ids
            this.sess = this.sess || this.safeUUID();
            this.user = this.user || this.safeUUID();
            if (this.cfg.debug) {
                // eslint-disable-next-line no-console
                console.warn(`${this.debugPrefix} localStorage unavailable, using in-memory ids`, err);
            }
        }

        // initialize listeners in a safe manner
        try { this.initOnce(); } catch (err) {
            // swallow init errors — don't break the host page
            if (this.cfg.debug) {
                // eslint-disable-next-line no-console
                console.error(`${this.debugPrefix} initOnce failed`, err);
            }
            this.inited = true; // mark as inited to avoid retry loops
        }
    }

    // ========== Public API ==========

    identify(id: string) {
        try {
            if (!this.enabled || !id) return;
            this.user = id;
            try { if (typeof localStorage !== "undefined") localStorage.setItem("visly_u", id); } catch (_) { }
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.error(`${this.debugPrefix} identify error`, err); }
        }
    }

    setSession(id: string) {
        try {
            if (!this.enabled || !id) return;
            this.sess = id;
            try { if (typeof localStorage !== "undefined") localStorage.setItem("visly_s", id); } catch (_) { }
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.error(`${this.debugPrefix} setSession error`, err); }
        }
    }

    track(name: string, props: Record<string, unknown> = {}) {
        // fastest check to avoid doing work if disabled
        if (!this.enabled) return;
        // protect entire method
        try {
            if (!name) return;

            // sampling
            const isError = name.toLowerCase().includes("error") || name.toLowerCase().includes("exception");
            const sampleRate = isError ? this.cfg.errorSampleRate : this.cfg.sampleRate;
            if (sampleRate < 1 && Math.random() > sampleRate) return;

            const u = this.safeURL(location?.href);

            const ev: EventBase = {
                event: name,
                event_time: Date.now(),
                project_id: this.cfg.projectId,
                path: typeof location !== "undefined" ? location.pathname : undefined,
                url: typeof location !== "undefined" ? location.href : undefined,
                referrer: typeof document !== "undefined" ? document.referrer || null : null,
                viewport_w: typeof innerWidth === "number" ? innerWidth : undefined,
                viewport_h: typeof innerHeight === "number" ? innerHeight : undefined,
                session_id: this.sess,
                user_id: this.user,
                ua: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
                utm: {
                    source: u?.searchParams.get("utm_source") || null,
                    medium: u?.searchParams.get("utm_medium") || null,
                    campaign: u?.searchParams.get("utm_campaign") || null
                },
                ...props
            };

            // avoid huge props — cap one event size roughly (best-effort check)
            try {
                const str = JSON.stringify(ev);
                if (str.length > 200 * 1024) { // 200 KB cap per event
                    if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} dropped oversized event`); }
                    return;
                }
            } catch (_) {
                // if JSON stringify fails, just continue (server will validate)
            }

            this.enqueue(ev);
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.error(`${this.debugPrefix} track error`, err); }
            // swallow errors
        }
    }

    flush(beacon = false) {
        if (!this.enabled) return;
        try {
            if (!this.buf.length) return;

            // If network requests are disabled (e.g., development without debug flag),
            // we drop the buffer instead of attempting network calls.
            if (!this.networkEnabled) {
                if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} network disabled — dropping ${this.buf.length} events`); }
                this.buf = [];
                return;
            }

            const batch = this.buf.splice(0, this.cfg.maxBatch);
            const body = batch.map(e => {
                try { return JSON.stringify(e); } catch (_) { return "{}"; }
            }).join("\n");

            // prefer sendBeacon when requested and available
            try {
                if (beacon && typeof navigator !== "undefined" && (navigator as any).sendBeacon) {
                    try {
                        (navigator as any).sendBeacon(this.cfg.endpoint, body);
                        return;
                    } catch (err) {
                        // sendBeacon can throw on bad input; fallback to fetch
                        if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} sendBeacon failed, falling back to fetch`, err); }
                    }
                }
            } catch (err) {
                if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} sendBeacon availability check failed`, err); }
            }

            // fetch with timeout and keepalive (best-effort)
            this.fetchWithTimeout(this.cfg.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/x-ndjson" },
                body,
                keepalive: true
            }, this.cfg.requestTimeoutMs).catch((err) => {
                // Requeue on failure with cap
                try {
                    this.buf = batch.concat(this.buf).slice(0, this.cfg.maxQueueSize);
                } catch (_) { this.buf = []; }
                if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} send failed, requeued`, err); }
            }).finally(() => {
                // arm timer if we still have items
                if (this.buf.length) this.arm();
            });
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.error(`${this.debugPrefix} flush error`, err); }
        }
    }

    // ========== internals ==========

    private initOnce() {
        if (this.inited) return;
        this.inited = true;

        // fire initial pageview but wrap call so any failures are swallowed
        try { // schedule on next tick to avoid blocking constructor
            setTimeout(() => { try { this.track("pageview"); } catch (_) { } }, 0);
        } catch (_) { }

        // delegated click capture — the handler is fully defensive
        try {
            if (typeof addEventListener !== "undefined") {
                addEventListener("click", (e) => {
                    try { void this.onClick(e as MouseEvent); } catch (err) { if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.error(`${this.debugPrefix} click handler error`, err); } }
                }, { capture: true });
            }
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} failed to attach click handler`, err); }
        }

        // visibility/pagehide flush with beacon preference
        try {
            if (typeof addEventListener !== "undefined") {
                addEventListener("visibilitychange", () => {
                    try { if (document.visibilityState === "hidden") this.flush(true); } catch (_) { }
                });
                addEventListener("pagehide", () => { try { this.flush(true); } catch (_) { } });
            }
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} visibility/pagehide attach failed`, err); }
        }

        // future hooks: PerfObserver, fetch/XHR instrumentation — attach safely with try/catch where used
    }

    private enqueue(ev: EventBase) {
        try {
            // cap queue (drop oldest items)
            if (this.buf.length >= this.cfg.maxQueueSize) {
                this.buf.shift();
            }
            this.buf.push(ev);
            if (this.buf.length >= this.cfg.maxBatch) this.flush();
            else this.arm();
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.error(`${this.debugPrefix} enqueue error`, err); }
        }
    }

    private arm() {
        try {
            if (this.timer) return;
            this.timer = setTimeout(() => {
                this.timer = null;
                try { this.flush(); } catch (_) { }
            }, this.cfg.flushInterval);
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} arm error`, err); }
        }
    }

    private async onClick(ev: MouseEvent) {
        if (!this.enabled) return;
        try {
            const t = (ev.target as HTMLElement)?.closest?.("[data-va]") as HTMLElement || (ev.target as HTMLElement);
            if (!t) return;

            const rawText = (t.innerText || "").slice(0, 200);
            const hash = await this.safeHashHex(rawText);

            const props: Record<string, unknown> = {
                el_name: t.getAttribute?.("data-va") || "",
                el_type: (t.tagName || "").toLowerCase(),
                el_role: t.getAttribute?.("role") || "",
                el_id: t.id || "",
                el_class: (t as any).className || "",
                el_href: (t as any).href || "",
                el_text_hash: hash
            };

            // add relative coordinates if available (best-effort)
            try {
                const rect = (t as HTMLElement).getBoundingClientRect?.();
                if (rect) {
                    props.el_x = Math.round(ev.clientX - rect.left);
                    props.el_y = Math.round(ev.clientY - rect.top);
                }
            } catch (_) { }

            // optionally add raw text if captureText=true (but WARNING: PII)
            if (this.cfg.captureText) {
                try { props.el_text = rawText; } catch (_) { }
            }

            this.track("click", props);
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.error(`${this.debugPrefix} onClick error`, err); }
            // swallow
        }
    }

    // ---------- utility helpers ----------

    private safeURL(href?: string | null) {
        try { return href ? new URL(href) : null; } catch (_) { return null; }
    }

    private safeUUID() {
        try { return typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `visly-${Math.floor(Math.random() * 1e9)}`; } catch (_) { return `visly-${Math.floor(Math.random() * 1e9)}`; }
    }

    // Compute hex SHA-256 with a fallback non-crypto hash (never rejects)
    private async safeHashHex(input: string) {
        try {
            if (typeof crypto !== "undefined" && crypto.subtle && crypto.subtle.digest) {
                const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
                return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
            }
        } catch (err) {
            if (this.cfg.debug) { /* eslint-disable-next-line no-console */ console.warn(`${this.debugPrefix} crypto.hash failed, using fallback`, err); }
        }
        // fallback: fast non-cryptographic hex (deterministic)
        try {
            let h = 2166136261 >>> 0;
            for (let i = 0; i < input.length; i++) {
                h ^= input.charCodeAt(i);
                h = Math.imul(h, 16777619) >>> 0;
            }
            // return repeated hex to mimic length somewhat
            return (h >>> 0).toString(16).padStart(8, "0").repeat(4);
        } catch (_) { return ""; }
    }

    // fetch with timeout; never rejects synchronously — returns a promise that may reject which callers catch
    private async fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 10_000) {
        // If AbortController is not available, fallback to regular fetch
        try {
            if (typeof AbortController === "undefined") {
                return fetch(input, init);
            }
        } catch (_) {
            return fetch(input, init);
        }

        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), timeoutMs);
            const merged: RequestInit = { ...init, signal: controller.signal } as RequestInit;
            const res = await fetch(input, merged);
            clearTimeout(id);
            return res;
        } catch (err) {
            // rethrow to let caller handle requeue logic — caller already wraps it
            throw err;
        }
    }
}
