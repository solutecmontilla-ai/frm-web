const webpush = require("web-push");
const db = require("../db");

webpush.setVapidDetails(
  "mailto:admin@frm.amaysgroup.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function pushRoutes(fastify) {
  // GET /api/push/vapid-key — clave pública para suscripción
  fastify.get("/vapid-key", async () => ({
    publicKey: process.env.VAPID_PUBLIC_KEY,
  }));

  // POST /api/push/subscribe
  fastify.post("/subscribe", async (req, reply) => {
    const { endpoint, keys } = req.body ?? {};
    if (!endpoint || !keys?.p256dh || !keys?.auth)
      return reply.code(400).send({ error: "Suscripción inválida" });

    await db.query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth)`,
      [endpoint, keys.p256dh, keys.auth]
    );
    return { ok: true };
  });

  // POST /api/push/unsubscribe
  fastify.post("/unsubscribe", async (req) => {
    const { endpoint } = req.body ?? {};
    if (endpoint) {
      await db.query("DELETE FROM push_subscriptions WHERE endpoint = ?", [endpoint]);
    }
    return { ok: true };
  });
}

// Envía push a todos los suscriptores
async function sendPushToAll(title, body, url = "/") {
  const [subs] = await db.query(
    "SELECT id, endpoint, p256dh, auth FROM push_subscriptions"
  );
  const payload = JSON.stringify({ title, body, url });
  const dead = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
      } catch (err) {
        // 404/410 = suscripción expirada
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(s.id);
      }
    })
  );

  if (dead.length) {
    await db.query(`DELETE FROM push_subscriptions WHERE id IN (${dead.map(() => "?").join(",")})`, dead);
  }
}

module.exports = { pushRoutes, sendPushToAll };
