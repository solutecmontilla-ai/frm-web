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

// Agrupa las actualizaciones de un torneo y envía UNA sola notificación
// cuando pasan NOTIFY_DELAY_MS sin nuevas cargas (evita 5 pushes por jornada).
const NOTIFY_DELAY_MS = 90 * 1000;
const TORNEO_INFO = {
  torneo40: { nombre: "Liga FRM +40", url: "/torneo-40" },
  torneo35: { nombre: "Liga FRM +35", url: "/torneo-35" },
};
const pending = {};

function queueNotify(torneo, tipo, detalle) {
  const info = TORNEO_INFO[torneo] ?? { nombre: "Liga FRM", url: "/" };
  const p = (pending[torneo] ??= { resultado: [], suspendido: [], proximos: 0, timer: null });
  if (tipo === "proximos") p.proximos += detalle;
  else p[tipo].push(detalle);

  clearTimeout(p.timer);
  p.timer = setTimeout(() => {
    delete pending[torneo];
    const partes = [];
    let title;
    if (p.resultado.length === 1 && !p.proximos && !p.suspendido.length) {
      title = `⚽ ${info.nombre} — Nuevo resultado`;
      partes.push(p.resultado[0]);
    } else if (p.resultado.length) {
      title = `⚽ ${info.nombre} — ${p.resultado.length} resultado${p.resultado.length > 1 ? "s" : ""} nuevo${p.resultado.length > 1 ? "s" : ""}`;
      partes.push(p.resultado.slice(0, 3).join(" · ") + (p.resultado.length > 3 ? " …" : ""));
    } else if (p.proximos) {
      title = `📅 ${info.nombre} — Nueva programación`;
    } else {
      title = `⚠️ ${info.nombre} — Partido suspendido`;
    }
    if (p.suspendido.length) partes.push(`Suspendido: ${p.suspendido.join(", ")}`);
    if (p.proximos) partes.push(`${p.proximos} partido${p.proximos > 1 ? "s" : ""} programado${p.proximos > 1 ? "s" : ""}`);
    sendPushToAll(title, partes.join("\n"), info.url).catch(() => {});
  }, NOTIFY_DELAY_MS);
}

module.exports = { pushRoutes, sendPushToAll, queueNotify };
