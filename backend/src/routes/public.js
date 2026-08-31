const db = require("../db");
const { getEdicionActiva, calcularTabla, calcularGoleadores, calcularAmarillas } = require("../standings");

async function publicRoutes(fastify) {
  // GET /api/:torneo/tabla
  fastify.get("/:torneo/tabla", async (req, reply) => {
    const edicionId = await getEdicionActiva(req.params.torneo);
    const teams = await calcularTabla(edicionId);
    return { teams };
  });

  // GET /api/:torneo/goleadores
  fastify.get("/:torneo/goleadores", async (req, reply) => {
    const edicionId = await getEdicionActiva(req.params.torneo);
    const scorers = await calcularGoleadores(edicionId);
    return { scorers };
  });

  // GET /api/:torneo/amarillas — tabla general de amonestados
  fastify.get("/:torneo/amarillas", async (req, reply) => {
    const edicionId = await getEdicionActiva(req.params.torneo);
    const jugadores = await calcularAmarillas(edicionId);
    return { jugadores };
  });

  // GET /api/:torneo/disciplina — vista completa por equipo (tarjetas + multas + suspensiones)
  fastify.get("/:torneo/disciplina", async (req, reply) => {
    const edicionId = await getEdicionActiva(req.params.torneo);

    const [amarillas] = await db.query(
      `SELECT a.id, a.jugador_nombre, eq.nombre AS equipo, a.multa_pagada, a.fecha_pago,
              p.jornada_label, p.fecha_partido
       FROM amarillas a
       JOIN partidos p  ON p.id = a.partido_id
       JOIN equipos  eq ON eq.id = a.equipo_id
       WHERE p.edicion_id = ?
       ORDER BY eq.nombre, a.jugador_nombre, p.id`,
      [edicionId]
    );

    const [rojas] = await db.query(
      `SELECT r.id, r.jugador_nombre, eq.nombre AS equipo, r.tipo, r.multa_pagada, r.fecha_pago,
              p.jornada_label, p.fecha_partido
       FROM rojas r
       JOIN partidos p  ON p.id = r.partido_id
       JOIN equipos  eq ON eq.id = r.equipo_id
       WHERE p.edicion_id = ?
       ORDER BY eq.nombre, r.jugador_nombre`,
      [edicionId]
    );

    const [suspensiones] = await db.query(
      `SELECT s.id, s.jugador_nombre, eq.nombre AS equipo, s.motivo, s.fecha_sancion, s.cumplida
       FROM suspensiones s
       JOIN equipos eq ON eq.id = s.equipo_id
       WHERE s.edicion_id = ?
       ORDER BY s.cumplida ASC, s.fecha_sancion DESC`,
      [edicionId]
    );

    return { amarillas, rojas, suspensiones };
  });

  // GET /api/:torneo/disciplina/:equipo — solo un equipo
  fastify.get("/:torneo/disciplina/:equipo", async (req, reply) => {
    const edicionId = await getEdicionActiva(req.params.torneo);
    const equipoSlug = req.params.equipo;

    const [[equipo]] = await db.query(
      "SELECT id, nombre FROM equipos WHERE (slug = ? OR nombre = ?) LIMIT 1",
      [equipoSlug, equipoSlug]
    );
    if (!equipo) return reply.code(404).send({ error: "Equipo no encontrado" });

    const [amarillas] = await db.query(
      `SELECT a.id, a.jugador_nombre, a.multa_pagada, a.fecha_pago,
              p.jornada_label, p.fecha_partido
       FROM amarillas a
       JOIN partidos p ON p.id = a.partido_id
       WHERE p.edicion_id = ? AND a.equipo_id = ?
       ORDER BY a.jugador_nombre, p.id`,
      [edicionId, equipo.id]
    );

    const [rojas] = await db.query(
      `SELECT r.id, r.jugador_nombre, r.tipo, r.multa_pagada, r.fecha_pago,
              p.jornada_label
       FROM rojas r
       JOIN partidos p ON p.id = r.partido_id
       WHERE p.edicion_id = ? AND r.equipo_id = ?`,
      [edicionId, equipo.id]
    );

    const [suspensiones] = await db.query(
      `SELECT s.id, s.jugador_nombre, s.motivo, s.fecha_sancion, s.cumplida
       FROM suspensiones s
       WHERE s.edicion_id = ? AND s.equipo_id = ?
       ORDER BY s.cumplida ASC, s.fecha_sancion DESC`,
      [edicionId, equipo.id]
    );

    // Acumular amarillas por jugador para mostrar contador
    const contadorAmarillas = {};
    for (const a of amarillas) {
      contadorAmarillas[a.jugador_nombre] = (contadorAmarillas[a.jugador_nombre] || 0) + 1;
    }

    const jugadores = Object.entries(contadorAmarillas).map(([nombre, total]) => ({
      nombre,
      amarillas: total,
      proximaSuspension: total % 3 === 2 ? "⚠️ Próxima en 1" : total % 3 === 0 ? "🚨 Suspendido" : null,
    }));

    return { equipo: equipo.nombre, jugadores, amarillas, rojas, suspensiones };
  });

  // GET /api/:torneo/resultados
  fastify.get("/:torneo/resultados", async (req, reply) => {
    const edicionId = await getEdicionActiva(req.params.torneo);
    const [partidos] = await db.query(
      `SELECT p.*,
              el.nombre AS local_nombre,
              ev.nombre AS visita_nombre
       FROM partidos p
       JOIN equipos el ON el.id = p.equipo_local_id
       JOIN equipos ev ON ev.id = p.equipo_visita_id
       WHERE p.edicion_id = ? AND p.fase = 'regular' AND p.estado IN ('jugado', 'suspendido')
       ORDER BY p.jornada_num DESC, p.id DESC`,
      [edicionId]
    );

    // Agrupar por jornada
    const jornadasMap = {};
    for (const p of partidos) {
      const key = p.jornada_num;
      if (!jornadasMap[key]) {
        jornadasMap[key] = { number: p.jornada_num, label: p.jornada_label, matches: [] };
      }
      const [goles] = p.estado === "suspendido" ? [[]] : await db.query(
        `SELECT g.jugador_nombre AS name, g.cantidad AS goals, g.equipo_id
         FROM goles g WHERE g.partido_id = ?`,
        [p.id]
      );
      jornadasMap[key].matches.push({
        homeTeam:    p.local_nombre,
        homeScore:   p.goles_local,
        homeScorers: goles.filter((g) => g.equipo_id === p.equipo_local_id).map((g) => ({ name: g.name, goals: g.goals })),
        awayTeam:    p.visita_nombre,
        awayScore:   p.goles_visita,
        awayScorers: goles.filter((g) => g.equipo_id === p.equipo_visita_id).map((g) => ({ name: g.name, goals: g.goals })),
        ...(p.estado === "suspendido" ? { status: "SUSPENDIDO" } : {}),
      });
    }

    const jornadas = Object.values(jornadasMap).sort((a, b) => b.number - a.number);
    return { jornadas };
  });

  // GET /api/:torneo/proximos
  fastify.get("/:torneo/proximos", async (req, reply) => {
    const edicionId = await getEdicionActiva(req.params.torneo);
    const [rows] = await db.query(
      `SELECT pr.*, el.nombre AS local_nombre, ev.nombre AS visita_nombre
       FROM proximos pr
       JOIN equipos el ON el.id = pr.equipo_local_id
       JOIN equipos ev ON ev.id = pr.equipo_visita_id
       WHERE pr.edicion_id = ?
       ORDER BY pr.id ASC`,
      [edicionId]
    );

    // Agrupar por día + cancha para separar venues del mismo día
    const diasMap = {};
    for (const r of rows) {
      const key = `${r.dia}||${r.cancha}`;
      if (!diasMap[key]) diasMap[key] = { day: r.dia, venue: r.cancha, matches: [] };
      diasMap[key].matches.push({ homeTeam: r.local_nombre, awayTeam: r.visita_nombre, time: r.hora });
    }

    // Calcular equipos que descansan
    const playing = new Set(rows.flatMap((r) => [r.local_nombre, r.visita_nombre]));
    const [equiposEdicion] = await db.query(
      `SELECT e.nombre FROM equipos e
       JOIN edicion_equipos ee ON ee.equipo_id = e.id
       WHERE ee.edicion_id = ?`,
      [edicionId]
    );
    const descansa = rows.length > 0
      ? equiposEdicion.filter((e) => !playing.has(e.nombre)).map((e) => e.nombre)
      : [];

    return { phase: "Próximos Partidos", matchdays: Object.values(diasMap), descansa };
  });

  // GET /api/:torneo/ediciones — historial de ediciones con resumen
  fastify.get("/:torneo/ediciones", async (req, reply) => {
    const [t] = await db.query("SELECT id FROM torneos WHERE slug = ?", [req.params.torneo]);
    if (!t.length) return reply.code(404).send({ error: "Torneo no encontrado" });

    const [rows] = await db.query(
      "SELECT id, nombre, numero, activa FROM ediciones WHERE torneo_id = ? ORDER BY numero DESC",
      [t[0].id]
    );

    const ediciones = await Promise.all(rows.map(async (ed) => {
      const [[final]] = await db.query(
        `SELECT p.ganador, el.nombre AS local_nombre, ev.nombre AS visita_nombre,
                p.goles_local, p.goles_visita, p.penales_local, p.penales_visita
         FROM partidos p
         JOIN equipos el ON el.id = p.equipo_local_id
         JOIN equipos ev ON ev.id = p.equipo_visita_id
         WHERE p.edicion_id = ? AND p.fase = 'F' AND p.ganador IS NOT NULL
         LIMIT 1`,
        [ed.id]
      );

      const champion = final
        ? (final.ganador === "local" ? final.local_nombre : final.visita_nombre)
        : null;
      const runnerUp = final
        ? (final.ganador === "local" ? final.visita_nombre : final.local_nombre)
        : null;
      const finalScore = final
        ? `${final.goles_local}-${final.goles_visita}${final.penales_local !== null ? ` (pen ${final.penales_local}-${final.penales_visita})` : ""}`
        : null;

      const [[topScorer]] = await db.query(
        `SELECT g.jugador_nombre AS name, eq.nombre AS team, SUM(g.cantidad) AS goals
         FROM goles g
         JOIN partidos p ON p.id = g.partido_id
         JOIN equipos eq ON eq.id = g.equipo_id
         WHERE p.edicion_id = ?
         GROUP BY g.jugador_nombre, g.equipo_id
         ORDER BY goals DESC
         LIMIT 1`,
        [ed.id]
      );

      const [[{ total: totalPartidos }]] = await db.query(
        "SELECT COUNT(*) AS total FROM partidos WHERE edicion_id = ? AND fase = 'regular' AND estado = 'jugado'",
        [ed.id]
      );

      return {
        ...ed,
        champion:    champion || null,
        runnerUp:    runnerUp || null,
        finalScore:  finalScore || null,
        topScorer:   topScorer ? { name: topScorer.name, team: topScorer.team, goals: Number(topScorer.goals) } : null,
        totalPartidos: totalPartidos || 0,
      };
    }));

    return { ediciones };
  });

  // GET /api/:torneo/playoff
  fastify.get("/:torneo/playoff", async (req, reply) => {
    const edicionId = await getEdicionActiva(req.params.torneo);
    const [partidos] = await db.query(
      `SELECT p.*,
              el.nombre AS local_nombre, el.seed AS local_seed,
              ev.nombre AS visita_nombre, ev.seed AS visita_seed
       FROM partidos p
       JOIN equipos el ON el.id = p.equipo_local_id
       JOIN equipos ev ON ev.id = p.equipo_visita_id
       WHERE p.edicion_id = ? AND p.fase IN ('QF','SF','F','TP')
       ORDER BY p.id ASC`,
      [edicionId]
    );

    const toTeam = (nombre, seed, score, penScore, goles, equipoId) => ({
      name: nombre,
      seed,
      score: score ?? null,
      penaltyScore: penScore ?? null,
      scorers: goles.filter((g) => g.equipo_id === equipoId).map((g) => ({ name: g.name, goals: g.goals })),
    });

    const toMatch = async (p, label) => {
      const [goles] = await db.query(
        `SELECT g.jugador_nombre AS name, g.cantidad AS goals, g.equipo_id
         FROM goles g WHERE g.partido_id = ?`,
        [p.id]
      );
      return {
        label,
        team1:    toTeam(p.local_nombre, p.local_seed, p.goles_local, p.penales_local, goles, p.equipo_local_id),
        team2:    toTeam(p.visita_nombre, p.visita_seed, p.goles_visita, p.penales_visita, goles, p.equipo_visita_id),
        winner:   p.ganador === "local" ? 1 : p.ganador === "visita" ? 2 : null,
        penalties: !!(p.penales_local !== null),
      };
    };

    const qf = partidos.filter((p) => p.fase === "QF");
    const sf = partidos.filter((p) => p.fase === "SF");
    const tp = partidos.find((p)  => p.fase === "TP");
    const fi = partidos.find((p)  => p.fase === "F");

    const quarterFinals = await Promise.all(qf.map((p, i) => toMatch(p, `Llave ${["A","B","C","D"][i] ?? i+1}`)));
    const semiFinals    = await Promise.all(sf.map((p, i) => toMatch(p, `Semi ${i + 1}`)));
    const thirdPlace    = tp ? await toMatch(tp, "Tercer Lugar") : null;
    const final         = fi
      ? await toMatch(fi, "Gran Final")
      : { label: "Gran Final", team1: null, team2: null, winner: null, penalties: false };

    let champion = null;
    if (fi && fi.ganador) {
      champion = fi.ganador === "local" ? fi.local_nombre : fi.visita_nombre;
    }

    return { quarterFinals, semiFinals, thirdPlace, final, champion };
  });
  // GET /api/sedes — listado público para dropdowns
  fastify.get("/sedes", async (req, reply) => {
    const [rows] = await db.query("SELECT id, nombre, maps_url FROM sedes ORDER BY nombre ASC");
    return { sedes: rows };
  });

  // GET /api/torneos/hero — info de hero por torneo (edición activa) + stats
  fastify.get("/torneos/hero", async (req, reply) => {
    const [rows] = await db.query(
      `SELECT t.slug AS torneo, e.id AS edicion_id, e.nombre AS edicion_nombre, e.numero,
              e.equipos_count, e.hero_subtitle, e.hero_description
       FROM torneos t
       LEFT JOIN ediciones e ON e.torneo_id = t.id AND e.activa = 1`
    );
    const out = {};
    for (const r of rows) {
      let stats = { equipos: 0, jornadas: 0, goles: 0, partidos: 0 };
      if (r.edicion_id) {
        const [[c1]] = await db.query("SELECT COUNT(*) AS n FROM edicion_equipos WHERE edicion_id=?", [r.edicion_id]);
        const [[c2]] = await db.query("SELECT COUNT(DISTINCT jornada_num) AS n FROM partidos WHERE edicion_id=? AND fase='regular' AND estado='jugado' AND jornada_num IS NOT NULL", [r.edicion_id]);
        const [[c3]] = await db.query("SELECT COALESCE(SUM(cantidad),0) AS n FROM goles g JOIN partidos p ON p.id=g.partido_id WHERE p.edicion_id=?", [r.edicion_id]);
        const [[c4]] = await db.query("SELECT COUNT(*) AS n FROM partidos WHERE edicion_id=? AND estado='jugado'", [r.edicion_id]);
        stats = { equipos: Number(c1.n), jornadas: Number(c2.n), goles: Number(c3.n), partidos: Number(c4.n) };
      }
      out[r.torneo] = {
        edicionNombre: r.edicion_nombre,
        numero: r.numero,
        equiposCount: r.equipos_count ?? stats.equipos,
        heroSubtitle: r.hero_subtitle,
        heroDescription: r.hero_description,
        stats,
      };
    }
    return { torneos: out };
  });

  // GET /api/:torneo/equipos — equipos vinculados a la edición activa
  fastify.get("/:torneo/equipos", async (req, reply) => {
    const [t] = await db.query("SELECT id FROM torneos WHERE slug = ?", [req.params.torneo]);
    if (!t.length) return reply.code(404).send({ error: "Torneo no encontrado" });

    const [[ed]] = await db.query(
      "SELECT id FROM ediciones WHERE torneo_id=? AND activa=1 LIMIT 1",
      [t[0].id]
    );
    if (!ed) return { equipos: [] };

    const [equipos] = await db.query(
      `SELECT eq.id, eq.nombre, eq.slug, eq.seed, eq.logo_url
       FROM edicion_equipos ee
       JOIN equipos eq ON eq.id = ee.equipo_id
       WHERE ee.edicion_id = ? AND eq.torneo_id = ?
       ORDER BY eq.nombre ASC`,
      [ed.id, t[0].id]
    );
    return { equipos };
  });
}

module.exports = publicRoutes;
