export type VislyOptions = {
    projectId: string;
    endpoint?: string;       // default: /api/e
    flushInterval?: number;  // ms
    maxBatch?: number;       // events per batch
};

type EventBase = {
    event: string;
    event_time: number;
    project_id: string;
    path: string;
    url: string;
    referrer: string | null;
    viewport_w: number; viewport_h: number;
    session_id: string; user_id: string;
    ua: string;
    utm?: { source?: string | null; medium?: string | null; campaign?: string | null };
    [k: string]: unknown;
};

const DEFAULTS = { endpoint: "/api/e", flushInterval: 8000, maxBatch: 40 };

export class VislyClient {
    private cfg: Required<VislyOptions>;
    private sess = "";
    private user = "";
    private buf: EventBase[] = [];
    private timer: ReturnType<typeof setTimeout> | null = null;
    private inited = false;

    constructor(opts: VislyOptions) {
        this.cfg = { ...DEFAULTS, ...opts } as Required<VislyOptions>;
        this.sess = localStorage.visly_s || (localStorage.visly_s = crypto.randomUUID());
        this.user = localStorage.visly_u || (localStorage.visly_u = crypto.randomUUID());
        this.initOnce();
    }

    identify(id: string) { if (!id) return; this.user = id; localStorage.visly_u = id; }
    setSession(id: string) { if (!id) return; this.sess = id; localStorage.visly_s = id; }

    track(name: string, props: Record<string, unknown> = {}) {
        const u = new URL(location.href);
        const ev: EventBase = {
            event: name,
            event_time: Date.now(),
            project_id: this.cfg.projectId,
            path: location.pathname,
            url: location.href,
            referrer: document.referrer || null,
            viewport_w: innerWidth, viewport_h: innerHeight,
            session_id: this.sess, user_id: this.user,
            ua: navigator.userAgent,
            utm: {
                source: u.searchParams.get("utm_source"),
                medium: u.searchParams.get("utm_medium"),
                campaign: u.searchParams.get("utm_campaign"),
            },
            ...props
        };
        this.enqueue(ev);
    }

    flush(beacon = false) {
        if (!this.buf.length) return;
        const batch = this.buf.splice(0, this.cfg.maxBatch);
        const body = batch.map(e => JSON.stringify(e)).join("\n"); // NDJSON
        if (beacon && navigator.sendBeacon) { navigator.sendBeacon(this.cfg.endpoint, body); return; }
        fetch(this.cfg.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/x-ndjson" },
            body, keepalive: true
        }).catch(() => { this.buf = batch.concat(this.buf).slice(0, 1000); })
            .finally(() => { if (this.buf.length) this.arm(); });
    }

    // ---- internals ----
    private initOnce() {
        if (this.inited) return;
        this.inited = true;
        this.track("pageview");
        addEventListener("click", (e) => { void this.onClick(e as MouseEvent); }, { capture: true });
        addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") this.flush(true); });
        addEventListener("pagehide", () => this.flush(true));
    }

    private enqueue(ev: EventBase) {
        this.buf.push(ev);
        if (this.buf.length >= this.cfg.maxBatch) this.flush();
        else this.arm();
    }

    private arm() {
        if (this.timer) return;
        this.timer = setTimeout(() => { this.timer = null; this.flush(); }, this.cfg.flushInterval);
    }

    private async onClick(ev: MouseEvent) {
        const t = (ev.target as HTMLElement)?.closest?.("[data-va]") as HTMLElement || (ev.target as HTMLElement);
        if (!t) return;
        const text = (t.innerText || "").slice(0, 200);
        const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
            .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join(""));
        this.track("click", {
            el_name: t.getAttribute?.("data-va") || "",
            el_type: (t.tagName || "").toLowerCase(),
            el_role: t.getAttribute?.("role") || "",
            el_id: t.id || "",
            el_class: (t as any).className || "",
            el_href: (t as any).href || "",
            el_text_hash: hash
        });
    }
}
