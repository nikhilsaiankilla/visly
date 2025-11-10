// server.ts
// CommonJS-style requires (useful if your TS config doesn't use ESModuleInterop)
const Fastify = require("fastify") as any;
const cors = require("@fastify/cors") as any;
const rateLimit = require("@fastify/rate-limit") as any;
const compress = require("@fastify/compress") as any;
// UAParser via require (works reliably with its typings when not using ESM import)
const UAParser = require("ua-parser-js");

// If you prefer JS instead of TS, save this file as `server.js` and remove the `as any` casts.

const app = Fastify({
    logger: true,
    trustProxy: true,
    bodyLimit: 5 * 1024 * 1024,
});

// --- Plugins ---
(async () => {
    try {
        await app.register(cors, { origin: true, credentials: false });
        await app.register(compress, { global: true });
        await app.register(rateLimit, {
            max: 600,
            timeWindow: "1 minute",
            ban: 0,
        });
    } catch (err) {
        app.log.error({ err }, "plugin_register_failed");
        process.exit(1);
    }
})();

// Accept NDJSON as raw text; keep default JSON parser for application/json
app.addContentTypeParser(
    ["application/x-ndjson", "text/plain", "text/*"],
    { parseAs: "string" },
    function (_req: any, payload: any, done: any) {
        try {
            if (typeof payload === "string") {
                done(null, payload);
                return;
            }
            if (Buffer.isBuffer(payload)) {
                done(null, payload.toString("utf8"));
                return;
            }
            if (payload && typeof payload.on === "function") {
                let data = "";
                payload.on("data", (chunk: Buffer | string) => {
                    data += chunk.toString();
                });
                payload.on("end", () => done(null, data));
                payload.on("error", (err: Error) => done(err));
                return;
            }
            done(null, String(payload ?? ""));
        } catch (err) {
            done(err);
        }
    }
);

// --- Health ---
app.get("/healthz", () => ({ ok: true, service: "collector" }));

// --- Utils ---
function getClientIP(req: any) {
    const xf = (req.headers["x-forwarded-for"] as string) || "";
    const first = xf.split(",")[0].trim();
    const ip = first || (req.socket?.remoteAddress as string) || null;
    if (!ip) return null;
    const m = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
    return m ? m[1] : ip;
}

function parseNdjson(body: string) {
    const ok: any[] = [];
    const bad: string[] = [];
    for (const line of body.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
            ok.push(JSON.parse(trimmed));
        } catch {
            bad.push(trimmed);
        }
    }
    return { ok, bad };
}

function validate(e: any) {
    if (!e || typeof e !== "object") return "invalid_event";
    if (!e.event || typeof e.event !== "string") return "missing_event";
    if (typeof e.event_time !== "number") return "missing_event_time";
    if (!e.project_id || typeof e.project_id !== "string") return "missing_project_id";
    const now = Date.now();
    if (Math.abs(now - e.event_time) > 7 * 24 * 3600 * 1000) return "event_time_out_of_range";
    return null;
}

function enrich(e: any, req: any) {
    const uaString = (typeof e.ua === "string" && e.ua) || (req.headers["user-agent"] as string) || "";
    const parser = new UAParser(uaString);
    const uar = parser.getResult();

    const ip = getClientIP(req);

    const cfCountry = (req.headers["cf-ipcountry"] as string) || null;
    const flyCountry = (req.headers["fly-client-ip-country"] as string) || null;
    const vercelCountry = (req.headers["x-vercel-ip-country"] as string) || null;
    const country = cfCountry || flyCountry || vercelCountry || null;

    const region =
        (req.headers["x-vercel-ip-country-region"] as string) ||
        (req.headers["cf-region-code"] as string) ||
        null;

    const city =
        (req.headers["x-vercel-ip-city"] as string) ||
        (req.headers["cf-ipcity"] as string) ||
        null;

    return {
        ...e,
        server_time: Date.now(),
        ip,
        country,
        region,
        city,
        browser: (uar.browser && uar.browser.name) || null,
        browser_version: (uar.browser && uar.browser.version) || null,
        os: (uar.os && uar.os.name) || null,
        os_version: (uar.os && uar.os.version) || null,
        device_type: (uar.device && uar.device.type) || "desktop",
    };
}

// --- Ingest ---
app.post("/e", async (req: any, reply: any) => {
    try {
        const ct = (req.headers["content-type"] || "").toString().toLowerCase();

        let rawEvents: any[] = [];
        let parseErrors: string[] = [];

        if (ct.includes("application/x-ndjson") || ct.startsWith("text/")) {
            const body = (req.body as string) || "";
            if (!body.trim()) {
                return reply.code(400).send({ ok: false, error: "empty_body" });
            }
            const { ok, bad } = parseNdjson(body);
            rawEvents = ok;
            parseErrors = bad;
        } else if (ct.includes("application/json")) {
            const b = req.body as any;
            if (Array.isArray(b)) rawEvents = b;
            else if (b && typeof b === "object") rawEvents = [b];
            else return reply.code(400).send({ ok: false, error: "invalid_json" });
        } else {
            const body = (req.body as any) || "";
            if (typeof body === "string") {
                const { ok, bad } = parseNdjson(body);
                rawEvents = ok;
                parseErrors = bad;
            } else {
                return reply.code(415).send({ ok: false, error: "unsupported_content_type" });
            }
        }

        const accepted: any[] = [];
        const rejected: { error: string; index: number }[] = [];

        rawEvents.forEach((e, idx) => {
            const err = validate(e);
            if (err) {
                rejected.push({ error: err, index: idx });
            } else {
                accepted.push(enrich(e, req));
            }
        });

        req.log.info({
            msg: "ingest",
            accepted: accepted.length,
            rejected: rejected.length,
            parseErrors: parseErrors.length,
            project_id: accepted[0]?.project_id ?? rawEvents[0]?.project_id ?? null,
        });

        // TODO: async push accepted events to pipeline (Kafka / ClickHouse / BigQuery)
        return reply.code(202).send({
            ok: true,
            accepted: accepted.length,
            rejected: rejected.length,
            parseErrors: parseErrors.length,
        });
    } catch (err: any) {
        req.log.error({ err }, "ingest_failed");
        return reply.code(500).send({ ok: false, error: "server_error" });
    }
});

const PORT = Number(process.env.PORT || 3001);
app
    .listen({ port: PORT, host: "0.0.0.0" })
    .then(() => app.log.info(`collector up on :${PORT}`))
    .catch((err: any) => {
        app.log.error(err, "listen_failed");
        process.exit(1);
    });
