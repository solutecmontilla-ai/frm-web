-- Migración: tabla sedes + campos hero en ediciones
-- Fecha: 2026-05-18

CREATE TABLE IF NOT EXISTS sedes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  maps_url VARCHAR(1000) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE ediciones
  ADD COLUMN IF NOT EXISTS equipos_count INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hero_subtitle VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hero_description VARCHAR(500) DEFAULT NULL;

-- Seed de sede común
INSERT IGNORE INTO sedes (nombre, maps_url) VALUES
  ('La Trinidad', NULL);
