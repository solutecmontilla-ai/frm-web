/**
 * Migración: JSON estáticos → MariaDB
 * Ejecutar UNA SOLA VEZ en el servidor:
 *   node migrate.js
 */
require("dotenv").config();
const fs   = require("fs");
const path = require("path");
const db   = require("./src/db");

const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, "../public/data");

function readJson(torneo, file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_PATH, torneo, `${file}.json`), "utf8"));
}

async function migrate() {
  console.log("Iniciando migración...");

  for (const slug of ["torneo40", "torneo35"]) {
    console.log(`\n→ ${slug}`);

    // Torneo
    const [[torneo]] = await db.query("SELECT id FROM torneos WHERE slug = ?", [slug]);
    const torneoId = torneo.id;

    // Edición activa (leer meta.json)
    let meta;
    try { meta = readJson(slug, "meta"); } catch { meta = { edicion: "1ra Edición", numero: 1 }; }

    const [edRes] = await db.query(
      "INSERT INTO ediciones (torneo_id, nombre, numero, activa) VALUES (?,?,?,1)",
      [torneoId, meta.edicion || "1ra Edición", meta.numero || 1]
    );
    const edicionId = edRes.insertId;
    console.log(`  Edición creada: ${meta.edicion} (id=${edicionId})`);

    // Equipos desde standings
    const standings = readJson(slug, "standings");
    const equipoMap = {};
    for (const t of standings.teams) {
      const slug2 = t.name.toLowerCase().replace(/\s+/g, "-");
      const [eq] = await db.query(
        "INSERT IGNORE INTO equipos (torneo_id, nombre, slug) VALUES (?,?,?)",
        [torneoId, t.name, slug2]
      );
      const [[row]] = await db.query("SELECT id FROM equipos WHERE torneo_id=? AND nombre=?", [torneoId, t.name]);
      equipoMap[t.name] = row.id;
    }
    console.log(`  ${Object.keys(equipoMap).length} equipos importados`);

    // Resultados de temporada regular
    const results = readJson(slug, "results");
    let totalPartidos = 0;
    for (const jornada of results.jornadas) {
      for (const m of jornada.matches) {
        const localId  = equipoMap[m.homeTeam];
        const visitaId = equipoMap[m.awayTeam];
        if (!localId || !visitaId) {
          console.warn(`  ⚠ Equipo no encontrado: ${m.homeTeam} o ${m.awayTeam}`);
          continue;
        }
        const ganador = m.homeScore > m.awayScore ? "local" : m.homeScore < m.awayScore ? "visita" : "empate";
        const [ins] = await db.query(
          `INSERT INTO partidos (edicion_id, equipo_local_id, equipo_visita_id, goles_local, goles_visita,
           ganador, fase, jornada_num, jornada_label, estado)
           VALUES (?,?,?,?,?,?, 'regular',?,?,'jugado')`,
          [edicionId, localId, visitaId, m.homeScore, m.awayScore, ganador, jornada.number, jornada.label]
        );
        const partidoId = ins.insertId;

        for (const g of (m.homeScorers || [])) {
          await db.query("INSERT INTO goles (partido_id, equipo_id, jugador_nombre, cantidad) VALUES (?,?,?,?)",
            [partidoId, localId, g.name, g.goals]);
        }
        for (const g of (m.awayScorers || [])) {
          await db.query("INSERT INTO goles (partido_id, equipo_id, jugador_nombre, cantidad) VALUES (?,?,?,?)",
            [partidoId, visitaId, g.name, g.goals]);
        }
        totalPartidos++;
      }
    }
    console.log(`  ${totalPartidos} partidos de temporada regular importados`);

    // Playoff
    const playoff = readJson(slug, "playoff");

    const importarFase = async (matches, fase) => {
      for (const m of matches) {
        if (m.team1?.score === null && m.team2?.score === null) continue;
        if (!m.team1 || !m.team2) continue;

        let localId  = equipoMap[m.team1.name];
        let visitaId = equipoMap[m.team2.name];

        // Crear equipo si no existe (puede haber nuevos en playoff)
        if (!localId) {
          const [ins] = await db.query("INSERT IGNORE INTO equipos (torneo_id, nombre, slug) VALUES (?,?,?)",
            [torneoId, m.team1.name, m.team1.name.toLowerCase().replace(/\s+/g, "-")]);
          const [[row]] = await db.query("SELECT id FROM equipos WHERE torneo_id=? AND nombre=?", [torneoId, m.team1.name]);
          localId = row.id;
          equipoMap[m.team1.name] = localId;
        }
        if (!visitaId) {
          const [ins] = await db.query("INSERT IGNORE INTO equipos (torneo_id, nombre, slug) VALUES (?,?,?)",
            [torneoId, m.team2.name, m.team2.name.toLowerCase().replace(/\s+/g, "-")]);
          const [[row]] = await db.query("SELECT id FROM equipos WHERE torneo_id=? AND nombre=?", [torneoId, m.team2.name]);
          visitaId = row.id;
          equipoMap[m.team2.name] = visitaId;
        }

        // Actualizar seed
        if (m.team1.seed) await db.query("UPDATE equipos SET seed=? WHERE id=?", [m.team1.seed, localId]);
        if (m.team2.seed) await db.query("UPDATE equipos SET seed=? WHERE id=?", [m.team2.seed, visitaId]);

        const ganador = m.winner === 1 ? "local" : m.winner === 2 ? "visita" : null;
        const penL = m.team1.penaltyScore ?? null;
        const penV = m.team2.penaltyScore ?? null;

        const [ins] = await db.query(
          `INSERT INTO partidos (edicion_id, equipo_local_id, equipo_visita_id, goles_local, goles_visita,
           penales_local, penales_visita, ganador, fase, estado)
           VALUES (?,?,?,?,?,?,?,?,?,'jugado')`,
          [edicionId, localId, visitaId, m.team1.score, m.team2.score, penL, penV, ganador, fase]
        );
        const partidoId = ins.insertId;

        for (const g of (m.team1.scorers || [])) {
          await db.query("INSERT INTO goles (partido_id, equipo_id, jugador_nombre, cantidad) VALUES (?,?,?,?)",
            [partidoId, localId, g.name, g.goals]);
        }
        for (const g of (m.team2.scorers || [])) {
          await db.query("INSERT INTO goles (partido_id, equipo_id, jugador_nombre, cantidad) VALUES (?,?,?,?)",
            [partidoId, visitaId, g.name, g.goals]);
        }
      }
    };

    await importarFase(playoff.quarterFinals || [], "QF");
    await importarFase(playoff.semiFinals   || [], "SF");
    if (playoff.final?.team1) await importarFase([playoff.final], "F");
    console.log(`  Playoff importado`);
  }

  console.log("\n✅ Migración completada");
  process.exit(0);
}

migrate().catch((e) => { console.error("❌", e.message); process.exit(1); });
