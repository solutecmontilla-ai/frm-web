const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream/promises");
const crypto = require("crypto");
const db = require("../db");
const { getEdicionActiva, calcularTabla, calcularGoleadores } = require("../standings");
const { sendPushToAll } = require("./push");

const SECRET = process.env.ADMIN_SECRET;

function checkAuth(req, reply) {
  if (req.headers["x-admin-secret"] !== SECRET) {
    reply.code(401).send({ error: "No autorizado" });
    return false;
  }
  return true;
}

async function getOrCreateEquipo(torneoSlug, nombre) {
  const [t] = await db.query("SELECT id FROM torneos WHERE slug = ?", [torneoSlug]);
  if (!t.length) throw new Error(`Torneo no encontrado: ${torneoSlug}`);
  const torneoId = t[0].id;

  const [eq] = await db.query(
    "SELECT id FROM equipos WHERE torneo_id = ? AND nombre = ?",
    [torneoId, nombre]
  );
  if (eq.length) return { id: eq[0].id, torneoId };

  const [res] = await db.query(
    "INSERT INTO equipos (torneo_id, nombre, slug) VALUES (?, ?, ?)",
    [torneoId, nombre, nombre.toLowerCase().replace(/\s+/g, "-")]
  );
  return { id: res.insertId, torneoId };
}

async function adminRoutes(fastify) {
  // POST /api/admin/resultado
  // Body: { torneo, localNombre, localGoles, visitaNombre, visitaGoles,
  //         jornada, jornadaLabel?, golesLocal, golesVisita, amarillasLocal, amarillasVisita }
  fastify.post("/resultado", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const {
      torneo, localNombre, localGoles, visitaNombre, visitaGoles,
      jornada = null, jornadaLabel = null,
      golesLocal = [], golesVisita = [],
      amarillasLocal = [], amarillasVisita = [],
      rojasLocal = [], rojasVisita = [],
    } = req.body;

    const edicionId = await getEdicionActiva(torneo);
    const { id: localId } = await getOrCreateEquipo(torneo, localNombre);
    const { id: visitaId } = await getOrCreateEquipo(torneo, visitaNombre);

    // Auto-marcar suspensiones cumplidas: el equipo juega jornada N → sirve la suspensión de jornada N-1
    if (jornada) {
      await db.query(
        `UPDATE suspensiones SET cumplida=1
         WHERE equipo_id IN (?, ?) AND edicion_id = ? AND cumplida=0 AND jornada_num IS NOT NULL AND jornada_num < ?`,
        [localId, visitaId, edicionId, jornada]
      );
    }

    const ganador = localGoles > visitaGoles ? "local" : localGoles < visitaGoles ? "visita" : "empate";

    // Buscar partido existente en esa jornada
    const [existing] = await db.query(
      `SELECT id FROM partidos WHERE edicion_id = ? AND equipo_local_id = ? AND equipo_visita_id = ? AND jornada_num = ?`,
      [edicionId, localId, visitaId, jornada]
    );

    let partidoId;
    if (existing.length) {
      partidoId = existing[0].id;
      await db.query(
        `UPDATE partidos SET goles_local=?, goles_visita=?, ganador=?, estado='jugado',
         jornada_label=? WHERE id=?`,
        [localGoles, visitaGoles, ganador, jornadaLabel, partidoId]
      );
      await db.query("DELETE FROM goles WHERE partido_id = ?", [partidoId]);
      await db.query("DELETE FROM amarillas WHERE partido_id = ?", [partidoId]);
    } else {
      const [ins] = await db.query(
        `INSERT INTO partidos
         (edicion_id, equipo_local_id, equipo_visita_id, goles_local, goles_visita,
          ganador, fase, jornada_num, jornada_label, estado)
         VALUES (?, ?, ?, ?, ?, ?, 'regular', ?, ?, 'jugado')`,
        [edicionId, localId, visitaId, localGoles, visitaGoles, ganador, jornada, jornadaLabel]
      );
      partidoId = ins.insertId;
    }

    // Insertar goles
    for (const g of golesLocal)  await db.query("INSERT INTO goles (partido_id, equipo_id, jugador_nombre, cantidad) VALUES (?,?,?,?)", [partidoId, localId,  g.name, g.goals]);
    for (const g of golesVisita) await db.query("INSERT INTO goles (partido_id, equipo_id, jugador_nombre, cantidad) VALUES (?,?,?,?)", [partidoId, visitaId, g.name, g.goals]);

    // Insertar amarillas
    for (const a of amarillasLocal)  {
      const [ins] = await db.query("INSERT INTO amarillas (partido_id, equipo_id, jugador_nombre) VALUES (?,?,?)", [partidoId, localId,  a]);
      await checkSuspensiones(ins.insertId, "amarilla");
    }
    for (const a of amarillasVisita) {
      const [ins] = await db.query("INSERT INTO amarillas (partido_id, equipo_id, jugador_nombre) VALUES (?,?,?)", [partidoId, visitaId, a]);
      await checkSuspensiones(ins.insertId, "amarilla");
    }

    // Insertar rojas + suspensión automática
    // roja_directa = 2 jornadas (insertar jornada_num N y N+1)
    // segunda_amarilla = 1 jornada (solo jornada_num N)
    for (const r of rojasLocal) {
      await db.query("INSERT INTO rojas (partido_id, equipo_id, jugador_nombre, tipo) VALUES (?,?,?,?)", [partidoId, localId, r.name, r.tipo ?? "directa"]);
      const motivo = r.tipo === "doble_amarilla" ? "segunda_amarilla" : "roja_directa";
      await db.query("INSERT INTO suspensiones (edicion_id, equipo_id, jugador_nombre, motivo, fecha_sancion, jornada_num) VALUES (?,?,?,?,CURDATE(),?)", [edicionId, localId, r.name, motivo, jornada]);
      if (motivo === "roja_directa") await db.query("INSERT INTO suspensiones (edicion_id, equipo_id, jugador_nombre, motivo, fecha_sancion, jornada_num) VALUES (?,?,?,?,CURDATE(),?)", [edicionId, localId, r.name, motivo, jornada + 1]);
    }
    for (const r of rojasVisita) {
      await db.query("INSERT INTO rojas (partido_id, equipo_id, jugador_nombre, tipo) VALUES (?,?,?,?)", [partidoId, visitaId, r.name, r.tipo ?? "directa"]);
      const motivo = r.tipo === "doble_amarilla" ? "segunda_amarilla" : "roja_directa";
      await db.query("INSERT INTO suspensiones (edicion_id, equipo_id, jugador_nombre, motivo, fecha_sancion, jornada_num) VALUES (?,?,?,?,CURDATE(),?)", [edicionId, visitaId, r.name, motivo, jornada]);
      if (motivo === "roja_directa") await db.query("INSERT INTO suspensiones (edicion_id, equipo_id, jugador_nombre, motivo, fecha_sancion, jornada_num) VALUES (?,?,?,?,CURDATE(),?)", [edicionId, visitaId, r.name, motivo, jornada + 1]);
    }

    const tabla = await calcularTabla(edicionId);
    const goleadores = await calcularGoleadores(edicionId);

    // Push notification a suscriptores
    const label = jornadaLabel || (jornada ? `Jornada ${jornada}` : "");
    sendPushToAll(
      "⚽ Liga FRM — Nuevo resultado",
      `${localNombre} ${localGoles} – ${visitaGoles} ${visitaNombre}${label ? " · " + label : ""}`,
      "/"
    ).catch(() => {});

    return { ok: true, tabla, goleadores };
  });

  // POST /api/admin/suspendido — marcar un partido como suspendido (sin resultado)
  // Body: { torneo, localNombre, visitaNombre, jornada, jornadaLabel? }
  fastify.post("/suspendido", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { torneo, localNombre, visitaNombre, jornada = null, jornadaLabel = null } = req.body;

    const edicionId = await getEdicionActiva(torneo);
    const { id: localId } = await getOrCreateEquipo(torneo, localNombre);
    const { id: visitaId } = await getOrCreateEquipo(torneo, visitaNombre);

    const [existing] = await db.query(
      `SELECT id FROM partidos WHERE edicion_id = ? AND equipo_local_id = ? AND equipo_visita_id = ? AND jornada_num = ?`,
      [edicionId, localId, visitaId, jornada]
    );

    if (existing.length) {
      await db.query(
        `UPDATE partidos SET estado='suspendido', jornada_label=? WHERE id=?`,
        [jornadaLabel, existing[0].id]
      );
    } else {
      await db.query(
        `INSERT INTO partidos
         (edicion_id, equipo_local_id, equipo_visita_id, fase, jornada_num, jornada_label, estado)
         VALUES (?, ?, ?, 'regular', ?, ?, 'suspendido')`,
        [edicionId, localId, visitaId, jornada, jornadaLabel]
      );
    }

    return { ok: true };
  });

  // POST /api/admin/playoff
  // Body: { torneo, fase, localNombre, localGoles, visitaNombre, visitaGoles,
  //         penalesLocal?, penalesVisita?, golesLocal, golesVisita }
  fastify.post("/playoff", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const {
      torneo, fase,
      localNombre, localGoles, visitaNombre, visitaGoles,
      penalesLocal = null, penalesVisita = null,
      golesLocal = [], golesVisita = [],
    } = req.body;

    const edicionId = await getEdicionActiva(torneo);
    const { id: localId } = await getOrCreateEquipo(torneo, localNombre);
    const { id: visitaId } = await getOrCreateEquipo(torneo, visitaNombre);

    let ganador;
    if (localGoles > visitaGoles) ganador = "local";
    else if (localGoles < visitaGoles) ganador = "visita";
    else ganador = penalesLocal > penalesVisita ? "local" : "visita";

    // Buscar por nombres en esa fase
    const [existing] = await db.query(
      `SELECT id FROM partidos
       WHERE edicion_id = ? AND fase = ?
         AND ((equipo_local_id = ? AND equipo_visita_id = ?)
           OR (equipo_local_id = ? AND equipo_visita_id = ?))`,
      [edicionId, fase, localId, visitaId, visitaId, localId]
    );

    let partidoId;
    if (existing.length) {
      partidoId = existing[0].id;
      await db.query(
        `UPDATE partidos SET goles_local=?, goles_visita=?, penales_local=?, penales_visita=?,
         ganador=?, estado='jugado', equipo_local_id=?, equipo_visita_id=? WHERE id=?`,
        [localGoles, visitaGoles, penalesLocal, penalesVisita, ganador, localId, visitaId, partidoId]
      );
      await db.query("DELETE FROM goles WHERE partido_id = ?", [partidoId]);
    } else {
      const [ins] = await db.query(
        `INSERT INTO partidos
         (edicion_id, equipo_local_id, equipo_visita_id, goles_local, goles_visita,
          penales_local, penales_visita, ganador, fase, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'jugado')`,
        [edicionId, localId, visitaId, localGoles, visitaGoles, penalesLocal, penalesVisita, ganador, fase]
      );
      partidoId = ins.insertId;
    }

    for (const g of golesLocal)  await db.query("INSERT INTO goles (partido_id, equipo_id, jugador_nombre, cantidad) VALUES (?,?,?,?)", [partidoId, localId,  g.name, g.goals]);
    for (const g of golesVisita) await db.query("INSERT INTO goles (partido_id, equipo_id, jugador_nombre, cantidad) VALUES (?,?,?,?)", [partidoId, visitaId, g.name, g.goals]);

    const faseLabels = { QF: "Cuartos de Final", SF: "Semifinal", F: "Gran Final", TP: "Tercer Lugar" };
    const faseLabel = faseLabels[fase] ?? fase;
    const scoreStr = penalesLocal != null
      ? `${localGoles}-${visitaGoles} (pen ${penalesLocal}-${penalesVisita})`
      : `${localGoles}-${visitaGoles}`;
    sendPushToAll(
      `⚽ Liga FRM — ${faseLabel}`,
      `${localNombre} ${scoreStr} ${visitaNombre}`,
      "/"
    ).catch(() => {});

    return { ok: true, ganador: ganador === "local" ? localNombre : visitaNombre };
  });

  // POST /api/admin/edicion — crear nueva edición (desactiva la actual)
  // Body: { torneo, nombre, numero }
  fastify.post("/edicion", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { torneo, nombre, numero } = req.body;

    const [t] = await db.query("SELECT id FROM torneos WHERE slug = ?", [torneo]);
    if (!t.length) return reply.code(404).send({ error: "Torneo no encontrado" });
    const torneoId = t[0].id;

    await db.query("UPDATE ediciones SET activa = 0 WHERE torneo_id = ? AND activa = 1", [torneoId]);

    const [ins] = await db.query(
      "INSERT INTO ediciones (torneo_id, nombre, numero, activa) VALUES (?, ?, ?, 1)",
      [torneoId, nombre, numero]
    );

    return { ok: true, edicionId: ins.insertId, nombre, torneo };
  });

  // GET /api/admin/ediciones/:torneo — listar todas las ediciones
  fastify.get("/ediciones/:torneo", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const [t] = await db.query("SELECT id FROM torneos WHERE slug = ?", [req.params.torneo]);
    if (!t.length) return reply.code(404).send({ error: "Torneo no encontrado" });

    const [rows] = await db.query(
      `SELECT id, nombre, numero, activa, equipos_count, hero_subtitle, hero_description
       FROM ediciones WHERE torneo_id = ? ORDER BY numero DESC`,
      [t[0].id]
    );
    return { ediciones: rows };
  });

  // PATCH /api/admin/edicion/:id/activar — cambiar edición activa manualmente
  fastify.patch("/edicion/:id/activar", async (req, reply) => {
    if (!checkAuth(req, reply)) return;

    const [[ed]] = await db.query("SELECT torneo_id FROM ediciones WHERE id = ?", [req.params.id]);
    if (!ed) return reply.code(404).send({ error: "Edición no encontrada" });

    await db.query("UPDATE ediciones SET activa = 0 WHERE torneo_id = ?", [ed.torneo_id]);
    await db.query("UPDATE ediciones SET activa = 1 WHERE id = ?", [req.params.id]);

    return { ok: true };
  });

  // POST /api/admin/proximo
  fastify.post("/proximo", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { torneo, localNombre, visitaNombre, dia, hora, cancha } = req.body;

    const edicionId = await getEdicionActiva(torneo);
    const { id: localId } = await getOrCreateEquipo(torneo, localNombre);
    const { id: visitaId } = await getOrCreateEquipo(torneo, visitaNombre);

    await db.query(
      "INSERT INTO proximos (edicion_id, equipo_local_id, equipo_visita_id, dia, hora, cancha) VALUES (?,?,?,?,?,?)",
      [edicionId, localId, visitaId, dia, hora, cancha]
    );
    return { ok: true };
  });

  // DELETE /api/admin/proximos/:torneo
  fastify.delete("/proximos/:torneo", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const edicionId = await getEdicionActiva(req.params.torneo);
    await db.query("DELETE FROM proximos WHERE edicion_id = ?", [edicionId]);
    return { ok: true };
  });

  // PATCH /api/admin/amarilla/:id/multa — marcar multa pagada
  fastify.patch("/amarilla/:id/multa", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const fecha = req.body.fecha || new Date().toISOString().slice(0, 10);
    await db.query("UPDATE amarillas SET multa_pagada=1, fecha_pago=? WHERE id=?", [fecha, req.params.id]);
    await checkSuspensiones(req.params.id, "amarilla");
    return { ok: true };
  });

  // GET /api/admin/partidos/:torneo — últimos 30 partidos jugados (para seleccionar en roja)
  fastify.get("/partidos/:torneo", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const edicionId = await getEdicionActiva(req.params.torneo).catch(() => null);
    if (!edicionId) return reply.code(404).send({ error: "No hay edición activa" });

    const [rows] = await db.query(
      `SELECT p.id, p.jornada_label, p.fase,
              el.nombre AS local_nombre, ev.nombre AS visita_nombre,
              p.goles_local, p.goles_visita
       FROM partidos p
       JOIN equipos el ON el.id = p.equipo_local_id
       JOIN equipos ev ON ev.id = p.equipo_visita_id
       WHERE p.edicion_id = ? AND p.estado = 'jugado'
       ORDER BY p.id DESC LIMIT 30`,
      [edicionId]
    );
    return { partidos: rows };
  });

  // POST /api/admin/equipo-logo — subir logo de equipo (multipart)
  fastify.post("/equipo-logo", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const data = await req.file();
    if (!data) return reply.code(400).send({ error: "No se recibió archivo" });

    const ext = path.extname(data.filename).toLowerCase() || ".png";
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext))
      return reply.code(400).send({ error: "Formato no permitido (usa PNG, JPG o WEBP)" });

    const filename = crypto.randomBytes(8).toString("hex") + ext;
    const webRoot = process.env.WEB_ROOT || "/home/amaysgr/frm.amaysgroup.com";
    const dir = path.join(webRoot, "logos");

    await fs.promises.mkdir(dir, { recursive: true });
    await pipeline(data.file, fs.createWriteStream(path.join(dir, filename)));

    return { url: `/logos/${filename}` };
  });

  // GET /api/admin/equipos/:torneo — listar equipos del torneo
  // ?all=1 → todos los equipos del torneo (incluye históricos)
  // por defecto → solo los vinculados a la edición activa
  fastify.get("/equipos/:torneo", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const [t] = await db.query("SELECT id FROM torneos WHERE slug = ?", [req.params.torneo]);
    if (!t.length) return reply.code(404).send({ error: "Torneo no encontrado" });

    if (req.query.all) {
      const [equipos] = await db.query(
        "SELECT id, nombre, slug, seed, logo_url FROM equipos WHERE torneo_id = ? ORDER BY nombre ASC",
        [t[0].id]
      );
      return { equipos };
    }

    const edicionId = await getEdicionActiva(req.params.torneo).catch(() => null);
    if (!edicionId) return { equipos: [] };

    const [equipos] = await db.query(
      `SELECT eq.id, eq.nombre, eq.slug, eq.seed, eq.logo_url
       FROM equipos eq
       JOIN edicion_equipos ee ON ee.equipo_id = eq.id
       WHERE ee.edicion_id = ? AND eq.torneo_id = ?
       ORDER BY eq.nombre ASC`,
      [edicionId, t[0].id]
    );
    return { equipos };
  });

  // POST /api/admin/equipo — crear equipo o actualizar seed/logo
  // Body: { torneo, nombre, seed?, logoUrl? }
  fastify.post("/equipo", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { torneo, nombre, seed = null, logoUrl = null } = req.body;

    const [t] = await db.query("SELECT id FROM torneos WHERE slug = ?", [torneo]);
    if (!t.length) return reply.code(404).send({ error: "Torneo no encontrado" });
    const torneoId = t[0].id;

    const slug = nombre.toLowerCase()
      .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e")
      .replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u")
      .replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const [existing] = await db.query(
      "SELECT id FROM equipos WHERE torneo_id = ? AND nombre = ?",
      [torneoId, nombre]
    );

    const edicionId = await getEdicionActiva(torneo).catch(() => null);

    if (existing.length) {
      const updates = ["seed = ?"];
      const vals = [seed];
      if (logoUrl) { updates.push("logo_url = ?"); vals.push(logoUrl); }
      vals.push(existing[0].id);
      await db.query(`UPDATE equipos SET ${updates.join(", ")} WHERE id = ?`, vals);
      // Asegurar vínculo con edición activa
      if (edicionId) {
        await db.query(
          "INSERT IGNORE INTO edicion_equipos (edicion_id, equipo_id) VALUES (?, ?)",
          [edicionId, existing[0].id]
        );
      }
      return { ok: true, id: existing[0].id, action: "updated" };
    }

    const [ins] = await db.query(
      "INSERT INTO equipos (torneo_id, nombre, slug, seed, logo_url) VALUES (?, ?, ?, ?, ?)",
      [torneoId, nombre, slug, seed, logoUrl]
    );
    if (edicionId) {
      await db.query(
        "INSERT IGNORE INTO edicion_equipos (edicion_id, equipo_id) VALUES (?, ?)",
        [edicionId, ins.insertId]
      );
    }
    return { ok: true, id: ins.insertId, action: "created" };
  });

  // POST /api/admin/edicion-equipos
  // Body: { edicionId, equipoIds: [int] } — reemplaza la lista completa
  fastify.post("/edicion-equipos", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { edicionId, equipoIds = [] } = req.body;
    if (!edicionId) return reply.code(400).send({ error: "edicionId requerido" });

    await db.query("DELETE FROM edicion_equipos WHERE edicion_id = ?", [edicionId]);
    for (const eqId of equipoIds) {
      await db.query(
        "INSERT IGNORE INTO edicion_equipos (edicion_id, equipo_id) VALUES (?, ?)",
        [edicionId, eqId]
      );
    }
    return { ok: true, count: equipoIds.length };
  });

  // DELETE /api/admin/edicion-equipos/:edicionId/:equipoId — quitar un equipo
  fastify.delete("/edicion-equipos/:edicionId/:equipoId", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    await db.query(
      "DELETE FROM edicion_equipos WHERE edicion_id = ? AND equipo_id = ?",
      [req.params.edicionId, req.params.equipoId]
    );
    return { ok: true };
  });

  // POST /api/admin/roja — registrar tarjeta roja
  fastify.post("/roja", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { torneo, partidoId, equipoNombre, jugadorNombre, tipo = "directa" } = req.body;
    const { id: equipoId } = await getOrCreateEquipo(torneo, equipoNombre);
    const [ins] = await db.query(
      "INSERT INTO rojas (partido_id, equipo_id, jugador_nombre, tipo) VALUES (?,?,?,?)",
      [partidoId, equipoId, jugadorNombre, tipo]
    );
    // Suspensión automática por roja: directa = 2 jornadas, segunda_amarilla = 1 jornada
    const [[partido]] = await db.query("SELECT edicion_id, jornada_num FROM partidos WHERE id=?", [partidoId]);
    if (partido) {
      const motivo = tipo === "doble_amarilla" ? "segunda_amarilla" : "roja_directa";
      await db.query(
        "INSERT INTO suspensiones (edicion_id, equipo_id, jugador_nombre, motivo, fecha_sancion, jornada_num) VALUES (?,?,?,?,CURDATE(),?)",
        [partido.edicion_id, equipoId, jugadorNombre, motivo, partido.jornada_num]
      );
      if (motivo === "roja_directa") {
        await db.query(
          "INSERT INTO suspensiones (edicion_id, equipo_id, jugador_nombre, motivo, fecha_sancion, jornada_num) VALUES (?,?,?,?,CURDATE(),?)",
          [partido.edicion_id, equipoId, jugadorNombre, motivo, partido.jornada_num + 1]
        );
      }
    }
    return { ok: true, id: ins.insertId };
  });

  // PATCH /api/admin/roja/:id/multa
  fastify.patch("/roja/:id/multa", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const fecha = req.body.fecha || new Date().toISOString().slice(0, 10);
    await db.query("UPDATE rojas SET multa_pagada=1, fecha_pago=? WHERE id=?", [fecha, req.params.id]);
    return { ok: true };
  });

  // PATCH /api/admin/suspension/:id/cumplida
  fastify.patch("/suspension/:id/cumplida", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    await db.query("UPDATE suspensiones SET cumplida=1 WHERE id=?", [req.params.id]);
    return { ok: true };
  });

  // ── Sedes CRUD ──
  fastify.get("/sedes", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const [rows] = await db.query("SELECT id, nombre, maps_url FROM sedes ORDER BY nombre ASC");
    return { sedes: rows };
  });

  fastify.post("/sedes", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { nombre, mapsUrl = null } = req.body;
    if (!nombre || !nombre.trim()) return reply.code(400).send({ error: "Nombre requerido" });
    try {
      const [ins] = await db.query(
        "INSERT INTO sedes (nombre, maps_url) VALUES (?, ?)",
        [nombre.trim(), mapsUrl]
      );
      return { ok: true, id: ins.insertId };
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") return reply.code(409).send({ error: "Ya existe una sede con ese nombre" });
      throw e;
    }
  });

  fastify.patch("/sedes/:id", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { nombre, mapsUrl } = req.body;
    const updates = [];
    const vals = [];
    if (nombre !== undefined) { updates.push("nombre = ?"); vals.push(nombre.trim()); }
    if (mapsUrl !== undefined) { updates.push("maps_url = ?"); vals.push(mapsUrl); }
    if (!updates.length) return { ok: true };
    vals.push(req.params.id);
    await db.query(`UPDATE sedes SET ${updates.join(", ")} WHERE id = ?`, vals);
    return { ok: true };
  });

  fastify.delete("/sedes/:id", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    await db.query("DELETE FROM sedes WHERE id = ?", [req.params.id]);
    return { ok: true };
  });

  // POST /api/admin/proximos/bulk
  // Body: { torneo, dia, partidos: [{ localNombre, visitaNombre, hora, cancha }] }
  fastify.post("/proximos/bulk", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { torneo, dia, partidos = [] } = req.body;
    if (!torneo || !dia || !Array.isArray(partidos) || !partidos.length)
      return reply.code(400).send({ error: "torneo, dia y partidos son requeridos" });

    const edicionId = await getEdicionActiva(torneo);
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      let count = 0;
      for (const p of partidos) {
        if (!p.localNombre || !p.visitaNombre || !p.hora) continue;
        const [t] = await conn.query("SELECT id FROM torneos WHERE slug = ?", [torneo]);
        const torneoId = t[0].id;

        const getOrCreate = async (nombre) => {
          const [eq] = await conn.query(
            "SELECT id FROM equipos WHERE torneo_id = ? AND nombre = ?",
            [torneoId, nombre]
          );
          if (eq.length) return eq[0].id;
          const [ins] = await conn.query(
            "INSERT INTO equipos (torneo_id, nombre, slug) VALUES (?, ?, ?)",
            [torneoId, nombre, nombre.toLowerCase().replace(/\s+/g, "-")]
          );
          return ins.insertId;
        };

        const localId = await getOrCreate(p.localNombre);
        const visitaId = await getOrCreate(p.visitaNombre);

        await conn.query(
          "INSERT INTO proximos (edicion_id, equipo_local_id, equipo_visita_id, dia, hora, cancha) VALUES (?,?,?,?,?,?)",
          [edicionId, localId, visitaId, dia, p.hora, p.cancha || ""]
        );
        count++;
      }
      await conn.commit();
      return { ok: true, count };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  });

  // PATCH /api/admin/edicion/:id/hero
  // Body: { equiposCount?, heroSubtitle?, heroDescription? }
  fastify.patch("/edicion/:id/hero", async (req, reply) => {
    if (!checkAuth(req, reply)) return;
    const { equiposCount, heroSubtitle, heroDescription } = req.body;
    const updates = [];
    const vals = [];
    if (equiposCount !== undefined) { updates.push("equipos_count = ?"); vals.push(equiposCount); }
    if (heroSubtitle !== undefined) { updates.push("hero_subtitle = ?"); vals.push(heroSubtitle); }
    if (heroDescription !== undefined) { updates.push("hero_description = ?"); vals.push(heroDescription); }
    if (!updates.length) return { ok: true };
    vals.push(req.params.id);
    await db.query(`UPDATE ediciones SET ${updates.join(", ")} WHERE id = ?`, vals);
    return { ok: true };
  });
}

// Verifica si un jugador llegó a 3 amarillas y genera suspensión automática
async function checkSuspensiones(amarillaId, tipo) {
  if (tipo !== "amarilla") return;
  const [[am]] = await db.query(
    "SELECT a.jugador_nombre, a.equipo_id, p.edicion_id, p.jornada_num FROM amarillas a JOIN partidos p ON p.id = a.partido_id WHERE a.id=?",
    [amarillaId]
  );
  if (!am) return;

  const [count] = await db.query(
    `SELECT COUNT(*) AS total FROM amarillas a
     JOIN partidos p ON p.id = a.partido_id
     WHERE a.jugador_nombre = ? AND a.equipo_id = ? AND p.edicion_id = ?`,
    [am.jugador_nombre, am.equipo_id, am.edicion_id]
  );

  if (count[0].total % 3 === 0) {
    await db.query(
      "INSERT INTO suspensiones (edicion_id, equipo_id, jugador_nombre, motivo, fecha_sancion, jornada_num) VALUES (?,?,?,?,CURDATE(),?)",
      [am.edicion_id, am.equipo_id, am.jugador_nombre, "3_amarillas", am.jornada_num]
    );
  }
}

module.exports = adminRoutes;
