const db = require("./db");

async function getEdicionActiva(torneoSlug) {
  const [rows] = await db.query(
    `SELECT e.id FROM ediciones e
     JOIN torneos t ON t.id = e.torneo_id
     WHERE t.slug = ? AND e.activa = 1
     LIMIT 1`,
    [torneoSlug]
  );
  if (!rows.length) throw new Error(`No hay edición activa para ${torneoSlug}`);
  return rows[0].id;
}

async function calcularTabla(edicionId) {
  // Equipos vinculados a la edición (arrancan con stats en 0)
  const [equipos] = await db.query(
    `SELECT eq.nombre
     FROM edicion_equipos ee
     JOIN equipos eq ON eq.id = ee.equipo_id
     WHERE ee.edicion_id = ?`,
    [edicionId]
  );

  const stats = {};
  for (const eq of equipos) {
    stats[eq.nombre] = { name: eq.nombre, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
  }

  const [partidos] = await db.query(
    `SELECT p.*,
            el.nombre AS local_nombre,
            ev.nombre AS visita_nombre
     FROM partidos p
     JOIN equipos el ON el.id = p.equipo_local_id
     JOIN equipos ev ON ev.id = p.equipo_visita_id
     WHERE p.edicion_id = ? AND p.fase = 'regular' AND p.estado = 'jugado'`,
    [edicionId]
  );

  for (const p of partidos) {
    for (const nombre of [p.local_nombre, p.visita_nombre]) {
      if (!stats[nombre]) {
        stats[nombre] = { name: nombre, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
      }
    }
    stats[p.local_nombre].played++;
    stats[p.visita_nombre].played++;
    stats[p.local_nombre].goalsFor      += p.goles_local;
    stats[p.local_nombre].goalsAgainst  += p.goles_visita;
    stats[p.visita_nombre].goalsFor     += p.goles_visita;
    stats[p.visita_nombre].goalsAgainst += p.goles_local;

    if (p.ganador === "local") {
      stats[p.local_nombre].won++;
      stats[p.visita_nombre].lost++;
    } else if (p.ganador === "visita") {
      stats[p.visita_nombre].won++;
      stats[p.local_nombre].lost++;
    } else {
      stats[p.local_nombre].drawn++;
      stats[p.visita_nombre].drawn++;
    }
  }

  return Object.values(stats)
    .map((t) => ({ ...t, goalDifference: t.goalsFor - t.goalsAgainst, points: t.won * 3 + t.drawn }))
    .sort((a, b) =>
      b.points - a.points ||
      b.goalDifference - a.goalDifference ||
      b.goalsFor - a.goalsFor ||
      a.name.localeCompare(b.name)
    )
    .map((t, i) => ({ ...t, position: i + 1 }));
}

async function calcularGoleadores(edicionId) {
  const [rows] = await db.query(
    `SELECT g.jugador_nombre AS name, eq.nombre AS team, SUM(g.cantidad) AS goals
     FROM goles g
     JOIN partidos p  ON p.id = g.partido_id
     JOIN equipos eq  ON eq.id = g.equipo_id
     WHERE p.edicion_id = ?
     GROUP BY g.jugador_nombre, g.equipo_id
     ORDER BY goals DESC`,
    [edicionId]
  );
  return rows;
}

async function calcularAmarillas(edicionId) {
  const [rows] = await db.query(
    `SELECT a.jugador_nombre AS name, eq.nombre AS team, COUNT(*) AS tarjetas
     FROM amarillas a
     JOIN partidos p  ON p.id = a.partido_id
     JOIN equipos eq  ON eq.id = a.equipo_id
     WHERE p.edicion_id = ?
     GROUP BY a.jugador_nombre, a.equipo_id
     ORDER BY tarjetas DESC`,
    [edicionId]
  );
  return rows;
}

module.exports = { getEdicionActiva, calcularTabla, calcularGoleadores, calcularAmarillas };
