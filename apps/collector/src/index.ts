// index.ts
/**
 * Collector HTTP server - entrypoint
 *
 * Responsibilities:
 * - Start Fastify HTTP server
 * - Parse incoming payloads (JSON / NDJSON / text)
 * - Validate & enrich events
 * - Convert to canonical events and push to Kafka via pushEvents()
 * - Wire Kafka lifecycle: connect at startup, disconnect on shutdown
 *
 * Notes:
 * - This file intentionally uses CommonJS-style `require` for some libs
 *   to avoid ESM import issues with certain packages (UAParser, fastify plugins).
 * - Ensure environment variables for Kafka are set:
 *   KAFKA_BROKER, KAFKA_CA_CERTIFICATE, KAFKA_USER_NAME, KAFKA_PASSWORD, KAFKA_TOPIC    
 */

import { pushEvents, connectKafka, disconnectKafka } from "./kafka";
import { redis } from "./redis";
import { toCanonicalEvent } from "./utils";
import dotenv from "dotenv";

dotenv.config();

// Use CommonJS-style require for some packages to avoid ESM/typing friction
const Fastify = require("fastify") as any;
const cors = require("@fastify/cors") as any;
const rateLimit = require("@fastify/rate-limit") as any;
const compress = require("@fastify/compress") as any;
const UAParser = require("ua-parser-js");

// Create Fastify instance with pretty logging for local/dev
const app = Fastify({
    logger: {
        transport: {
            target: "pino-pretty",
            options: {
                ignore: "pid,hostname",
                translateTime: "HH:MM:ss",
                colorize: true,
                messageFormat: "[collector] {msg}",
            },
        },
    },
    trustProxy: true,
    bodyLimit: 5 * 1024 * 1024, // 5MB max body
});

// --- Register plugins (CORS / compression / rate-limit) ---
(async () => {
    try {
        await app.register(cors, { origin: true, credentials: false });
        await app.register(compress, { global: true });
        await app.register(rateLimit, {
            max: 600, // requests
            timeWindow: "1 minute",
            ban: 0,
        });
    } catch (err) {
        app.log.error({ err }, "plugin_register_failed");
        process.exit(1);
    }
})();

// --- Content type parser for NDJSON & plain text ---
// Accept NDJSON (application/x-ndjson) and text variants and return raw string
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
            // If body is a stream
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

// --- Health endpoint ---
app.get("/healthz", () => ({ ok: true, service: "collector" }));

// ---------------- Utilities ----------------

/**
 * Extract client IP using x-forwarded-for or socket remoteAddress.
 * Normalizes IPv4-mapped addresses like ::ffff:1.2.3.4
 */
function getClientIP(req: any) {
    const xf = (req.headers["x-forwarded-for"] as string) || "";
    const first = xf.split(",")[0].trim();
    const ip = first || (req.socket?.remoteAddress as string) || null;
    if (!ip) return null;
    const m = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)/);
    return m ? m[1] : ip;
}

/**
 * Parse NDJSON string into JSON objects.
 * Returns { ok: Array<object>, bad: Array<string> } where bad lines failed to parse.
 */
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

/**
 * Basic event validation. Returns null on success or string error code on failure.
 * - event: string
 * - event_time: number (ms since epoch)
 * - project_id: string
 * - time must be within ±7 days
 */
function validate(e: any) {
    if (!e || typeof e !== "object") return "invalid_event";
    if (!e.event || typeof e.event !== "string") return "missing_event";
    if (typeof e.event_time !== "number") return "missing_event_time";
    if (!e.project_id || typeof e.project_id !== "string")
        return "missing_project_id";
    const now = Date.now();
    if (Math.abs(now - e.event_time) > 7 * 24 * 3600 * 1000)
        return "event_time_out_of_range";
    return null;
}

/**
 * Enrich event with server-side metadata: parsed UA, ip, geo-headers, server_time
 */
function enrich(e: any, req: any) {
    const uaString =
        (typeof e.ua === "string" && e.ua) || (req.headers["user-agent"] as string) || "";
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
        (req.headers["x-vercel-ip-city"] as string) || (req.headers["cf-ipcity"] as string) || null;

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

// ---------------- Ingest route ----------------

/**
 * POST /e
 * Accepts:
 * - application/json (object or array)
 * - application/x-ndjson (newline-delimited JSON)
 * - text/* (treated as NDJSON)
 *
 * Behavior:
 * 1. Parse input
 * 2. Validate and enrich each event
 * 3. Convert to canonical events
 * 4. Push to Kafka using pushEvents()
 * 5. Respond with accepted/rejected counts
 */
app.post("/e", async (req: any, reply: any) => {
    try {
        const ct = (req.headers["content-type"] || "").toString().toLowerCase();

        let rawEvents: any[] = [];
        let parseErrors: string[] = [];

        // Parse based on content type
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
            // Fallback: try to coerce to NDJSON
            const body = (req.body as any) || "";
            if (typeof body === "string") {
                const { ok, bad } = parseNdjson(body);
                rawEvents = ok;
                parseErrors = bad;
            } else {
                return reply
                    .code(415)
                    .send({ ok: false, error: "unsupported_content_type" });
            }
        }

        // Validate & enrich
        const enriched: any[] = [];
        const rejected: { error: string; index: number }[] = [];

        rawEvents.forEach((e, idx) => {
            const err = validate(e);
            if (err) {
                rejected.push({ error: err, index: idx });
            } else {
                enriched.push(enrich(e, req));
            }
        });

        // Convert to canonical representation for downstream (ClickHouse / analytics pipeline)
        const canonicalEvents = enriched.map(toCanonicalEvent);

        let isActive = true;

        const projectId = canonicalEvents[0]?.project_id ?? null;

        console.log('isActive before checking in the redis ', isActive);

        try {
            const key = `is_active:${projectId}`;
            console.log('key to check the isActive ', key);
            const val = await redis.get<boolean>(key);

            console.log('is_active after fetching from redis ', val);

            // Default: true if missing (optional — or set false instead)
            isActive = val !== false;
        } catch (err) {
            req.log.error({ err }, "redis_is_active_check_failed");

            // Fail-safe: treat Redis failure as inactive OR active.
            // You decide — but safer is: block sending to Kafka.
            isActive = false;
        }

         console.log('after updaing is active ', isActive);

        // If project disabled, drop events silently
        if (!isActive) {
            req.log.info({ projectId }, "project_disabled_drop_events");
            return reply.code(202).send({
                ok: true,
                accepted: 0,
                rejected: 0,
                dropped: canonicalEvents.length,
                reason: "project_disabled",
            });
        }

        // Push to Kafka. We await here to provide backpressure and return 503 if downstream fails.
        // If you prefer fire-and-forget, change to: pushEvents(canonicalEvents).catch(...)
        try {
            if (isActive) {
                await pushEvents(canonicalEvents);
            }
        } catch (err: unknown) {
            req.log.error({ err }, "kafka_push_failed");
            // Return 503 as downstream (Kafka) is unavailable
            return reply.code(503).send({ ok: false, error: "downstream_unavailable" });
        }

        return reply.code(202).send({
            ok: true,
            accepted: canonicalEvents.length,
            rejected: rejected.length,
            parseErrors: parseErrors.length,
        });
    } catch (err: any) {
        app.log.error({ err }, "ingest_failed");
        return reply.code(500).send({ ok: false, error: "server_error" });
    }
});

// ---------------- Startup & Shutdown ----------------

const PORT = Number(process.env.PORT || 3001);

/**
 * Start server:
 * - Connect to Kafka first (so pushEvents can succeed)
 * - If Kafka connection fails, we exit to avoid data loss (adjust if you prefer otherwise)
 */
async function start() {
    try {
        await connectKafka();
        app.log.info("kafka connected");
    } catch (err) {
        app.log.error({ err }, "kafka_connect_failed; exiting");
        // Exiting because ingestion without Kafka may cause data loss.
        // If you'd rather start server anyway, remove the next line.
        process.exit(1);
    }

    try {
        await app.listen({ port: PORT, host: "0.0.0.0" });
        app.log.info(`collector up on :${PORT}`);
    } catch (err: any) {
        app.log.error(err, "listen_failed");
        process.exit(1);
    }
}
start();

/**
 * Graceful shutdown:
 * - Close Fastify (stop accepting new requests, finish inflight)
 * - Disconnect Kafka
 */
async function gracefulShutdown(signal: string) {
    try {
        app.log.info({ signal }, "shutdown_initiated");
        await app.close();
        app.log.info("fastify closed");
    } catch (err) {
        app.log.error({ err }, "fastify_close_failed");
    }

    try {
        await disconnectKafka();
        app.log.info("kafka disconnected");
    } catch (err) {
        app.log.error({ err }, "kafka_disconnect_failed");
    }

    process.exit(0);
}

// Hooks for termination signals and unhandled errors
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (err: any) => {
    app.log.error({ err }, "uncaught_exception");
    gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason: any) => {
    app.log.error({ reason }, "unhandled_rejection");
});
