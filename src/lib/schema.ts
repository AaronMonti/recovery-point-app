
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pacientes = sqliteTable("pacientes", {
  id: text("id").primaryKey(),
  nombre_paciente: text("nombre_paciente").notNull(),
  tipo_paciente: text("tipo_paciente", { enum: ["particular", "obra_social"] }).notNull(),
  obra_social: text("obra_social"),
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