const { randomUUID } = require("crypto") as any;

const KNOWN_KEYS = new Set([
    "event",
    "event_time",
    "project_id",
    "path",
    "url",
    "referrer",
    "viewport_w",
    "viewport_h",
    "session_id",
    "user_id",
    "ua",
    "utm",
    "server_time",
    "ip",
    "country",
    "region",
    "city",
    "browser",
    "browser_version",
    "os",
    "os_version",
    "device_type",
]);

export function toCanonicalEvent(e: any): any {
    const utm = e.utm || {};

    // props = everything that's not in KNOWN_KEYS
    const props: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(e)) {
        if (!KNOWN_KEYS.has(k)) {
            props[k] = v;
        }
    }

    return {
        event_id: randomUUID(),

        project_id: String(e.project_id),
        event: String(e.event),

        event_time: Number(e.event_time),
        server_time: Number(e.server_time),

        user_id: e.user_id ?? null,
        session_id: e.session_id ?? null,

        path: e.path ?? null,
        url: e.url ?? null,
        referrer: e.referrer ?? null,

        ua: e.ua ?? null,
        browser: e.browser ?? null,
        browser_version: e.browser_version ?? null,
        os: e.os ?? null,
        os_version: e.os_version ?? null,
        device_type: e.device_type ?? null,

        ip: e.ip ?? null,
        country: e.country ?? null,
        region: e.region ?? null,
        city: e.city ?? null,

        viewport_w: typeof e.viewport_w === "number" ? e.viewport_w : null,
        viewport_h: typeof e.viewport_h === "number" ? e.viewport_h : null,

        utm_source: utm.source ?? null,
        utm_medium: utm.medium ?? null,
        utm_campaign: utm.campaign ?? null,

        props,
    };
}
