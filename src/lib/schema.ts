
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categorias = sqliteTable("categorias", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  created_at: text("created_at"),
});

export const obras_sociales = sqliteTable("obras_sociales", {
  id: text("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  created_at: text("created_at"),
});

export const pacientes = sqliteTable("pacientes", {
  id: text("id").primaryKey(),
  nombre_paciente: text("nombre_paciente").notNull(),
  tipo_paciente: text("tipo_paciente", { enum: ["particular", "obra_social"] }).notNull(),
  obra_social_id: text("obra_social_id").references(() => obras_sociales.id),
  categoria_id: text("categoria_id").references(() => categorias.id),
  nota_lesion: text("nota_lesion"),
  sesiones_totales: integer("sesiones_totales").notNull(),
  created_at: text("created_at"),
});

export const sesiones_diarias = sqliteTable("sesiones_diarias", {
  id: text("id").primaryKey(),
  paciente_id: text("paciente_id").references(() => pacientes.id),
  fecha: text("fecha").notNull(),
  hora: text("hora").notNull(),
  sentimiento: text("sentimiento", { enum: ["verde", "amarillo", "rojo"] }).notNull(),
});

export const evaluaciones = sqliteTable("evaluaciones", {
	id: text().primaryKey().notNull(),
	pacienteId: text("paciente_id").notNull().references(() => pacientes.id),
	sesionId: text("sesion_id").notNull().references(() => sesiones_diarias.id),
	fecha: text().notNull(),
	respuestasComprimidas: text("respuestas_comprimidas").notNull(),
	promediosComprimidos: text("promedios_comprimidos").notNull(),
	createdAt: text("created_at"),
});