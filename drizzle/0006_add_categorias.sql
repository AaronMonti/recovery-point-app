-- Crear tabla de categorías
CREATE TABLE `categorias` (
	`id` text PRIMARY KEY NOT NULL,
	`nombre` text NOT NULL,
	`descripcion` text,
	`created_at` text
);

-- Agregar columna categoria_id a la tabla pacientes
ALTER TABLE `pacientes` ADD `categoria_id` text REFERENCES categorias(id);
