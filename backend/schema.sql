-- Liga FRM — Schema
-- Ejecutar: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS amaysgr_frm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE amaysgr_frm;

CREATE TABLE IF NOT EXISTS torneos (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(20)  NOT NULL UNIQUE,  -- 'torneo40', 'torneo35'
  nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS ediciones (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  torneo_id INT NOT NULL,
  nombre    VARCHAR(100) NOT NULL,  -- '9na Edición'
  numero    INT NOT NULL,
  activa    TINYINT(1) DEFAULT 0,
  FOREIGN KEY (torneo_id) REFERENCES torneos(id)
);

CREATE TABLE IF NOT EXISTS equipos (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  torneo_id INT NOT NULL,
  nombre    VARCHAR(100) NOT NULL,
  slug      VARCHAR(100) NOT NULL,
  seed      INT DEFAULT 0,
  logo_url  VARCHAR(500) DEFAULT NULL,
  FOREIGN KEY (torneo_id) REFERENCES torneos(id),
  UNIQUE KEY uq_equipo (torneo_id, nombre)
);

CREATE TABLE IF NOT EXISTS partidos (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  edicion_id       INT NOT NULL,
  equipo_local_id  INT NOT NULL,
  equipo_visita_id INT NOT NULL,
  goles_local      INT DEFAULT NULL,
  goles_visita     INT DEFAULT NULL,
  penales_local    INT DEFAULT NULL,
  penales_visita   INT DEFAULT NULL,
  ganador          ENUM('local','visita','empate') DEFAULT NULL,
  fase             VARCHAR(10) NOT NULL DEFAULT 'regular',  -- regular, QF, SF, F
  jornada_num      INT DEFAULT NULL,
  jornada_label    VARCHAR(50) DEFAULT NULL,
  fecha_partido    DATE DEFAULT NULL,
  cancha           VARCHAR(100) DEFAULT NULL,
  estado           ENUM('pendiente','jugado','suspendido') DEFAULT 'pendiente',
  FOREIGN KEY (edicion_id)       REFERENCES ediciones(id),
  FOREIGN KEY (equipo_local_id)  REFERENCES equipos(id),
  FOREIGN KEY (equipo_visita_id) REFERENCES equipos(id)
);

CREATE TABLE IF NOT EXISTS goles (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  partido_id     INT NOT NULL,
  equipo_id      INT NOT NULL,
  jugador_nombre VARCHAR(100) NOT NULL,
  cantidad       INT DEFAULT 1,
  FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id)  REFERENCES equipos(id)
);

CREATE TABLE IF NOT EXISTS amarillas (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  partido_id     INT NOT NULL,
  equipo_id      INT NOT NULL,
  jugador_nombre VARCHAR(100) NOT NULL,
  multa_pagada   TINYINT(1) DEFAULT 0,
  fecha_pago     DATE DEFAULT NULL,
  FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id)  REFERENCES equipos(id)
);

CREATE TABLE IF NOT EXISTS rojas (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  partido_id     INT NOT NULL,
  equipo_id      INT NOT NULL,
  jugador_nombre VARCHAR(100) NOT NULL,
  tipo           ENUM('directa','doble_amarilla') DEFAULT 'directa',
  multa_pagada   TINYINT(1) DEFAULT 0,
  fecha_pago     DATE DEFAULT NULL,
  FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
  FOREIGN KEY (equipo_id)  REFERENCES equipos(id)
);

CREATE TABLE IF NOT EXISTS suspensiones (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  edicion_id     INT NOT NULL,
  equipo_id      INT NOT NULL,
  jugador_nombre VARCHAR(100) NOT NULL,
  motivo         ENUM('3_amarillas','roja_directa') NOT NULL,
  fecha_sancion  DATE NOT NULL,
  cumplida       TINYINT(1) DEFAULT 0,
  FOREIGN KEY (edicion_id) REFERENCES ediciones(id),
  FOREIGN KEY (equipo_id)  REFERENCES equipos(id)
);

CREATE TABLE IF NOT EXISTS proximos (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  edicion_id       INT NOT NULL,
  equipo_local_id  INT NOT NULL,
  equipo_visita_id INT NOT NULL,
  dia              VARCHAR(50),
  hora             VARCHAR(10),
  cancha           VARCHAR(100),
  FOREIGN KEY (edicion_id)       REFERENCES ediciones(id),
  FOREIGN KEY (equipo_local_id)  REFERENCES equipos(id),
  FOREIGN KEY (equipo_visita_id) REFERENCES equipos(id)
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  endpoint  TEXT NOT NULL,
  p256dh    TEXT NOT NULL,
  auth      TEXT NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_endpoint (endpoint(500))
);

-- Datos base
INSERT IGNORE INTO torneos (slug, nombre) VALUES
  ('torneo40', 'Liga FRM +40'),
  ('torneo35', 'Liga FRM +35');

-- Migración incremental (ejecutar manualmente si la DB ya existe)
-- ALTER TABLE equipos ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500) DEFAULT NULL;
-- ALTER TABLE suspensiones MODIFY COLUMN motivo ENUM('3_amarillas','roja_directa','segunda_amarilla') NOT NULL;
