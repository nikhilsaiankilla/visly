import Fastify from "fastify";
const app = Fastify({ logger: true });

app.get("/healthz", () => ({ ok: true, service: "worker" }));
// later: connect Kafka, consume, write to ClickHouse
setInterval(() => app.log.info("worker heartbeat"), 30000);

const PORT = Number(process.env.PORT || 3002);
app.listen({ port: PORT, host: "0.0.0.0" });
