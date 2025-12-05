// kafka.ts
import { Kafka, logLevel, Producer } from "kafkajs";

let kafkaProducer: Producer | null = null;
let kafkaClient: Kafka | null = null;
let connected = false;

const TOPIC = process.env.KAFKA_TOPIC || "visly-events";

/**
 * Create (or return cached) Kafka client.
 * Supports SSL/SASL with Aiven.
 */
export const getKafkaClient = (): Kafka => {
    if (kafkaClient) return kafkaClient;

    const brokerHost = process.env.KAFKA_BROKER;
    const clientId = process.env.KAFKA_CLIENT_ID || "visly-api";
    const username = process.env.KAFKA_USERNAME || "avnadmin";
    const password = process.env.KAFKA_PASSWORD;
    const caRaw = process.env.KAFKA_CA_CERTIFICATE;

    // Validation
    if (!brokerHost) throw new Error("KAFKA_BROKER missing");
    if (!caRaw) throw new Error("KAFKA_CA_CERTIFICATE missing");
    if (!password) throw new Error("KAFKA_PASSWORD missing");

    // Handle escaped \n or real newlines
    const ca = caRaw.includes("\\n") ? caRaw.replace(/\\n/g, "\n") : caRaw;

    kafkaClient = new Kafka({
        clientId,
        brokers: [brokerHost],
        ssl: {
            ca: [ca],
            rejectUnauthorized: true,
        },
        sasl: {
            mechanism: "plain",
            username,
            password,
        },
        connectionTimeout: 10000,
        requestTimeout: 30000,
        retry: {
            initialRetryTime: 300,
            retries: 8,
        },
        logLevel: logLevel.ERROR,
    });

    return kafkaClient;
};

/**
 * Explicitly connect the Kafka producer at startup.
 * Call this in your server initialization.
 */
export async function connectKafka(): Promise<void> {
    if (connected) {
        console.log("Kafka: already connected");
        return;
    }

    try {
        const kafka = getKafkaClient();

        kafkaProducer = kafka.producer({
            allowAutoTopicCreation: false, // We create topics explicitly
            transactionTimeout: 30000,
        });

        await kafkaProducer.connect();
        connected = true;
        console.log(`Kafka producer connected to topic: ${TOPIC}`);
    } catch (error) {
        console.error("Failed to connect Kafka producer:", error);
        connected = false;
        kafkaProducer = null;
        throw error;
    }
}

/**
 * Disconnect & cleanup (idempotent).
 */
export async function disconnectKafka(): Promise<void> {
    if (!kafkaProducer) {
        connected = false;
        return;
    }

    try {
        await kafkaProducer.disconnect();
        console.log("Kafka producer disconnected");
    } catch (err) {
        console.error("Kafka disconnect error:", err);
    } finally {
        kafkaProducer = null;
        kafkaClient = null;
        connected = false;
    }
}

/**
 * Push an array of events into Kafka topic.
 * Requires connectKafka() to be called first.
 */
export async function pushEvents(events: any[]): Promise<void> {
    if (!events || events.length === 0) {
        console.warn("pushEvents called with empty events array");
        return;
    }

    if (!connected || !kafkaProducer) {
        throw new Error(
            "Kafka producer not connected. Call connectKafka() first during server startup."
        );
    }
    
    try {
        await kafkaProducer.send({
            topic: TOPIC,
            messages: events.map((ev) => ({
                key: ev.project_id || "unknown",
                value: JSON.stringify(ev),
                timestamp: String(Date.now()),
            })),
        });

        console.log(`Kafka: sent ${events.length} message(s) to ${TOPIC}`);
    } catch (err: any) {
        console.error("Kafka send failed:", err);
        throw err;
    }
}

/**
 * Check if Kafka is connected and ready.
 */
export function isKafkaConnected(): boolean {
    return connected && kafkaProducer !== null;
}

/**
 * Graceful shutdown handler - call this explicitly from your server shutdown.
 */
export async function shutdownKafka(): Promise<void> {
    console.log("Shutting down Kafka connection...");
    await disconnectKafka();
}

// Backup cleanup on unexpected exit
process.on("beforeExit", async () => {
    if (kafkaProducer && connected) {
        try {
            await disconnectKafka();
        } catch (err) {
            console.error("Error in beforeExit Kafka cleanup:", err);
        }
    }
});