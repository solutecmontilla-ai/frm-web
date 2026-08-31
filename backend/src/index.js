require("dotenv").config();
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const multipart = require("@fastify/multipart");

const publicRoutes = require("./routes/public");
const adminRoutes  = require("./routes/admin");
const { pushRoutes } = require("./routes/push");

const PORT = parseInt(process.env.PORT || "3001");

const fastify = Fastify({ logger: { level: "warn" } });

fastify.register(cors, { origin: true });
fastify.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

fastify.register(publicRoutes, { prefix: "/api" });
fastify.register(adminRoutes,  { prefix: "/api/admin" });
fastify.register(pushRoutes,   { prefix: "/api/push" });

fastify.get("/health", async () => ({ ok: true }));

fastify.setErrorHandler((err, req, reply) => {
  fastify.log.error(err);
  reply.code(err.statusCode || 500).send({ error: err.message });
});

fastify.listen({ port: PORT, host: "127.0.0.1" }, (err) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`FRM API corriendo en puerto ${PORT}`);
});
