-- Migración: vincular equipos a ediciones
-- Fecha: 2026-05-18

CREATE TABLE IF NOT EXISTS edicion_equipos (
  edicion_id INT NOT NULL,
  equipo_id  INT NOT NULL,
  PRIMARY KEY (edicion_id, equipo_id),
  FOREIGN KEY (edicion_id) REFERENCES ediciones(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id)  REFERENCES equipos(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Backfill: equipos que jugaron en cada edición
INSERT IGNORE INTO edicion_equipos (edicion_id, equipo_id)
SELECT DISTINCT p.edicion_id, p.equipo_local_id FROM partidos p;

INSERT IGNORE INTO edicion_equipos (edicion_id, equipo_id)
SELECT DISTINCT p.edicion_id, p.equipo_visita_id FROM partidos p;

-- Backfill adicional: para cada edición activa, asegurar que todos los equipos
-- históricos del torneo queden vinculados (para que aparezcan en la tabla)
INSERT IGNORE INTO edicion_equipos (edicion_id, equipo_id)
SELECT e.id, eq.id
FROM ediciones e
JOIN equipos eq ON eq.torneo_id = e.torneo_id
WHERE e.activa = 1;
