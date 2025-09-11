-- Migración para actualizar la tabla pacientes y conectar con obras sociales
-- Primero agregar la nueva columna
ALTER TABLE pacientes ADD COLUMN obra_social_id TEXT REFERENCES obras_sociales(id);

-- Opcional: Migrar datos existentes si hay obras sociales como texto
-- UPDATE pacientes SET obra_social_id = (SELECT id FROM obras_sociales WHERE nombre = pacientes.obra_social) WHERE obra_social IS NOT NULL;

-- Eliminar la columna antigua (descomenta cuando estés seguro de que los datos se migraron)
-- ALTER TABLE pacientes DROP COLUMN obra_social;
