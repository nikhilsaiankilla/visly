// index.ts
/**
 * Worker:
 * - consumes from KAFKA_TOPIC
 * - writes messages to ClickHouse (each known key as its own column)
 * - on failure: re-publish to RETRY_TOPIC with exponential backoff (worker schedules the delay)
 * - after MAX_RETRIES -> publish to DLQ_TOPIC
 *
 * Single source of truth:
 * - getKafkaClient() builds the Kafka config (SSL / SASL) from env and returns a Kafka instance
 * - getClickhouseClient() returns a ClickHouse client
 *
 * Producer & Consumer are created lazily inside main() so KafkaJS logs appear after startup log.
 */

import { Kafka, Producer, Consumer, Message, Partitioners, logLevel } from "kafkajs";
import { ClickHouseClient, createClient } from "@clickhouse/client";
import dotenv from "dotenv";

dotenv.config();
/* ---------------- env / constants ---------------- */
const BROKERS = (process.env.KAFKA_BROKERS || process.env.KAFKA_BROKER || "localhost:9092")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const TOPIC = process.env.KAFKA_TOPIC || "visly-events";
const RETRY_TOPIC = process.env.KAFKA_RETRY_TOPIC || `visly-events-retry`;
const DLQ_TOPIC = process.env.KAFKA_DLQ_TOPIC || `visly-events-dlq`;
const GROUP_ID = process.env.KAFKA_GROUP_ID || "visly-worker-group";

const MAX_RETRIES = Number(process.env.MAX_RETRIES || 5);
const INITIAL_BACKOFF_MS = Number(process.env.INITIAL_BACKOFF_MS || 1000); // 1s
const BACKOFF_MULTIPLIER = Number(process.env.BACKOFF_MULTIPLIER || 2);

/* ---------------- list of known keys ---------------- */
const KNOWN_KEYS = [
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
];

/* ---------------- ClickHouse client factory ---------------- */
let clickhouseClient: ClickHouseClient | null = null;
export const getClickhouseClient = (): ClickHouseClient => {
    if (clickhouseClient) return clickhouseClient;

    const url = process.env.CLICKHOUSE_URL;
    const database = process.env.CLICKHOUSE_DATABASE;
    const username = process.env.CLICKHOUSE_USER_NAME;
    const password = process.env.CLICKHOUSE_PASSWORD;

    if (!url || !database || !username || !password)
        throw new Error("Missing ClickHouse configuration.");

    clickhouseClient = createClient({ url, database, username, password });
    console.log("ClickHouse client created for database:", database);

    return clickhouseClient;
};

/* ---------------- Kafka client factory (single source of truth) ---------------- */
let kafkaClient: Kafka | null = null;

export const getKafkaClient = (): Kafka => {
    if (kafkaClient) return kafkaClient;

    const brokerHost = process.env.KAFKA_BROKER;

    const clientId = process.env.KAFKA_CLIENT_ID || "visly-worker";
    const username = process.env.KAFKA_USERNAME || "avnadmin";
    const password = process.env.KAFKA_PASSWORD;
    const caRaw = process.env.KAFKA_CA_CERTIFICATE;

    // Validation
    if (!caRaw) throw new Error("KAFKA_CA_CERTIFICATE missing");
    if (!password) throw new Error("KAFKA_PASSWORD missing");
    if (!brokerHost) throw new Error("KAFKA_BROKER missing");

    // Handle escaped \n or real newlines
    const ca = caRaw.includes("\\n") ? caRaw.replace(/\\n/g, "\n") : caRaw;

    kafkaClient = new Kafka({
        clientId,
        brokers: [brokerHost],
        ssl: {
            ca: [ca], // Required for Aiven
            rejectUnauthorized: true, // Recommended for production
        },
        sasl: {
            mechanism: "plain",
            username,
            password,
        },
        logLevel: logLevel.ERROR, // Adjust as needed
    });

    return kafkaClient;
};

/* ---------------- helpers to map known keys to ClickHouse types ---------------- */
function getColumnType(key: string): string {
    // Pick types with analytics in mind
    switch (key) {
        case "event_time":
        case "server_time":
            return "DateTime64(3)";
        case "viewport_w":
        case "viewport_h":
            return "UInt32";
        default:
            return "String";
    }
}

/* ---------------- ClickHouse table creation ---------------- */
async function ensureEventsTableExists() {
    const db = process.env.CLICKHOUSE_DATABASE || "default";
    const tableName = "events";

    // Build column definitions from KNOWN_KEYS
    const columnsDefs = KNOWN_KEYS.map((k) => `\`${k}\` ${getColumnType(k)}`).join(",\n            ");

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${db}.${tableName} (
            ${columnsDefs}
        ) ENGINE = MergeTree()
        ORDER BY (project_id, event_time)
        PARTITION BY toYYYYMM(event_time)
        SETTINGS index_granularity = 8192
    `;

    try {
        if (clickhouseClient) {
            await clickhouseClient.exec({ query: createTableQuery });
            console.log(`Table ${db}.${tableName} exists or was created successfully`);
        } else {
            throw new Error("ClickHouse client not initialized");
        }
    } catch (error) {
        console.error(`Failed to create table ${db}.${tableName}:`, error);
        throw error;
    }
}

/* ---------------- ClickHouse insert helper (map known keys -> columns) ---------------- */
async function insertToClickhouse(event: any) {
    // Build a row object containing only known keys (and converted types)
    const formatDate = (val: number | string | null | undefined) => {
        // ClickHouse DateTime64(3) expects "YYYY-MM-DD hh:mm:ss.sss"
        if (!val) return null;
        const ms = typeof val === "number" ? val : Number(val);
        if (!Number.isFinite(ms)) {
            // try Date.parse if val was ISO string
            const parsed = Date.parse(String(val));
            if (Number.isFinite(parsed)) return formatDate(parsed);
            return null;
        }
        const d = new Date(ms);
        const YYYY = d.getUTCFullYear();
        const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
        const DD = String(d.getUTCDate()).padStart(2, "0");
        const hh = String(d.getUTCHours()).padStart(2, "0");
        const mm = String(d.getUTCMinutes()).padStart(2, "0");
        const ss = String(d.getUTCSeconds()).padStart(2, "0");
        const msPart = String(d.getUTCMilliseconds()).padStart(3, "0");
        return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}.${msPart}`;
    };

    const row: Record<string, any> = {};

    for (const key of KNOWN_KEYS) {
        const raw = event[key];

        if (raw === undefined || raw === null) {
            // Insert empty string for String types, 0 for UInt32, null for DateTime if allowed
            const colType = getColumnType(key);
            if (colType.startsWith("UInt")) {
                row[key] = 0;
            } else if (colType.startsWith("DateTime")) {
                // ClickHouse supports inserting Null only if the column is Nullable. To keep things simple,
                // insert a zero-time value for missing datetimes (1970-01-01 00:00:00.000)
                row[key] = "1970-01-01 00:00:00.000";
            } else {
                row[key] = "";
            }
            continue;
        }

        // Convert types
        switch (key) {
            case "viewport_w":
            case "viewport_h": {
                const n = Number(raw);
                row[key] = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
                break;
            }
            case "event_time":
            case "server_time": {
                // Accept epoch ms or ISO strings or numeric seconds
                const asNumber = Number(raw);
                if (Number.isFinite(asNumber) && String(raw).length > 10) {
                    // likely ms epoch
                    row[key] = formatDate(asNumber);
                } else if (Number.isFinite(asNumber) && String(raw).length <= 10) {
                    // maybe seconds epoch
                    row[key] = formatDate(asNumber * 1000);
                } else {
                    // try Date.parse
                    const parsed = Date.parse(String(raw));
                    if (Number.isFinite(parsed)) row[key] = formatDate(parsed);
                    else row[key] = "1970-01-01 00:00:00.000";
                }
                break;
            }
            default:
                row[key] = String(raw);
                break;
        }
    }

    const db = process.env.CLICKHOUSE_DATABASE || "default";

    // Use JSONEachRow with a single JSON object representing the row
    const jsonLines = JSON.stringify(row);
    const query = `INSERT INTO ${db}.events FORMAT JSONEachRow\n${jsonLines}`;

    if (clickhouseClient) {
        await clickhouseClient.exec({ query });
    }
}

/* ---------------- lazy producer/consumer (created in main) ---------------- */
let producer: Producer | null = null;
let consumer: Consumer | null = null;

/* helper: sleep */
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/* publish helper (uses lazy producer — throws if not initialized) */
async function republishMessage(original: Message, bodyObj: any, retryCount: number, errorMsg: string, topic = RETRY_TOPIC) {
    if (!producer) throw new Error("Producer not initialized");

    const newBody = {
        ...bodyObj,
        __retry_meta: {
            retry_count: retryCount,
            last_error: errorMsg,
            last_failed_at: Date.now(),
        },
    };

    const headers: Record<string, Buffer> = {
        retry_count: Buffer.from(String(retryCount)),
        last_error: Buffer.from(String(errorMsg).slice(0, 1024)),
    };

    await producer.send({
        topic,
        messages: [
            {
                key: original.key?.toString() ?? (bodyObj?.project_id ?? "unknown"),
                value: JSON.stringify(newBody),
                headers,
            },
        ],
    });

    console.log(`republished message to ${topic} with retry_count=${retryCount}`);
}

/* process single Kafka message */
async function processMessage(message: Message) {
    if (!producer) throw new Error("Producer not initialized"); // guard for safety

    const raw = message.value?.toString() ?? null;
    if (!raw) {
        console.warn("empty message, skipping");
        return;
    }

    let parsed: any;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        console.error("invalid JSON, sending to DLQ", err);
        await producer.send({
            topic: DLQ_TOPIC,
            messages: [{ key: message.key?.toString() ?? "unknown", value: raw }],
        });
        return;
    }

    const headerRetry = message.headers?.retry_count ? Number(message.headers.retry_count.toString()) : undefined;
    const bodyRetry = parsed?.__retry_meta?.retry_count;
    const retryCount = typeof headerRetry === "number" && !Number.isNaN(headerRetry) ? headerRetry : (typeof bodyRetry === "number" ? bodyRetry : 0);

    try {
        await insertToClickhouse(parsed);
        console.log("inserted to ClickHouse", { project_id: parsed.project_id, event: parsed.event });
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err?.message : String(err);
        console.error("ClickHouse insert failed:", errMsg);

        if (retryCount >= MAX_RETRIES) {
            console.error("max retries reached, sending to DLQ");
            await producer.send({
                topic: DLQ_TOPIC,
                messages: [{ key: message.key?.toString() ?? "unknown", value: JSON.stringify({ original: parsed, last_error: errMsg, failed_at: Date.now(), retry_count: retryCount }) }],
            });
            return;
        }

        const nextRetryCount = retryCount + 1;
        const backoff = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_MULTIPLIER, retryCount);

        console.log(`scheduling retry #${nextRetryCount} in ${backoff}ms`);
        setTimeout(async () => {
            try {
                await republishMessage(message, parsed, nextRetryCount, errMsg, RETRY_TOPIC);
            } catch (repErr) {
                console.error("failed to republish to retry topic:", repErr);
                await producer!.send({
                    topic: DLQ_TOPIC,
                    messages: [{ key: message.key?.toString() ?? "unknown", value: JSON.stringify({ original: parsed, last_error: `${errMsg}; republish_failed:${repErr}`, failed_at: Date.now(), retry_count: nextRetryCount }) }],
                });
            }
        }, backoff);

        return;
    }
}

/* ---------------- main lifecycle ---------------- */
async function main() {
    console.log("worker starting...");

    try {
        // Validate ClickHouse & Kafka client config
        getClickhouseClient(); // will throw if CLICKHOUSE_URL missing
        const kafka = getKafkaClient(); // will throw if brokers missing

        // CREATE CLICKHOUSE TABLE IF NOT EXISTS
        await ensureEventsTableExists();

        // CREATE KAFKA TOPICS IF NOT EXISTS
        // await ensureKafkaTopicsExist();

        // Create producer & consumer after startup log (lazy)
        producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
        consumer = kafka.consumer({ groupId: GROUP_ID });

        // Connect
        await producer.connect();
        console.log("kafka producer connected");

        await consumer.connect();
        console.log("kafka consumer connected");

        // Subscribe to topics
        await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
        if (RETRY_TOPIC !== TOPIC) {
            await consumer.subscribe({ topic: RETRY_TOPIC, fromBeginning: false });
        }

        // Start consuming
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                try {
                    await processMessage(message);
                } catch (err) {
                    console.error("processing loop threw:", err);
                }
            },
        });
    } catch (err) {
        console.error("fatal error during startup:", err);
        process.exit(1);
    }

    // graceful shutdown
    const shutdown = async (signal: string) => {
        try {
            console.info("shutdown signal:", signal);
            if (consumer) await consumer.disconnect();
            if (producer) await producer.disconnect();
            try {
                const ch = getClickhouseClient();
                if ((ch as any).close) await (ch as any).close();
            } catch (e) {
                /* ignore */
            }
            process.exit(0);
        } catch (e) {
            console.error("shutdown error", e);
            process.exit(1);
        }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
    console.error("fatal error in worker:", err);
    process.exit(1);
});
