import Fastify from "fastify";
const app = Fastify({ logger: true });

app.get("/healthz", () => ({ ok: true, service: "collector" }));
// placeholder ingest; later publish to Kafka
app.post("/e", (_req, reply) => reply.code(202).send({ ok: true }));

const PORT = Number(process.env.PORT || 3001);
app.listen({ port: PORT, host: "0.0.0.0" });
