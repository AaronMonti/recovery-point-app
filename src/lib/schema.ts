import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const pacientes = sqliteTable("pacientes", {
  id: text("id").primaryKey(),
  nombre_paciente: text("nombre_paciente").notNull(),
  nombre_kinesiologo: text("nombre_kinesiologo").notNull(),
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