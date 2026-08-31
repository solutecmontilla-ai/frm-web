-- ============================================================
-- Cierre +35 9na Edición y apertura 3era Edición Nocturna
-- ============================================================

-- 1. Limpiar proximos de la edición que se cierra
DELETE FROM proximos WHERE edicion_id = 2;

-- 2. Desactivar 9na Edición +35
UPDATE ediciones SET activa = 0 WHERE id = 2;

-- 3. Crear 3era Edición Nocturna (numero=10, activa)
INSERT INTO ediciones (torneo_id, nombre, numero, activa, equipos_count, hero_subtitle, hero_description)
VALUES (2, '3era Edición Nocturna', 10, 1, 7, '3era Edición Nocturna', '+35');

SET @nueva_ed = LAST_INSERT_ID();

-- 4. Crear equipo nuevo: Moto Toro FC
INSERT INTO equipos (torneo_id, nombre, slug, seed)
VALUES (2, 'Moto Toro FC', 'moto-toro-fc', 0);

SET @moto_toro = LAST_INSERT_ID();

-- 5. Vincular los 7 equipos a la nueva edición
--    FRM(13) | Coromoto FC(19) | Fénix(20) | Atl. San Ignacio(15)
--    The Family(16) | Atl. Mariño(14) | Moto Toro FC(nuevo)
INSERT INTO edicion_equipos (edicion_id, equipo_id) VALUES
(@nueva_ed, 13),
(@nueva_ed, 19),
(@nueva_ed, 20),
(@nueva_ed, 15),
(@nueva_ed, 16),
(@nueva_ed, 14),
(@nueva_ed, @moto_toro);
