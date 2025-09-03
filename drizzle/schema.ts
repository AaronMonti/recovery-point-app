import { sqliteTable, AnySQLiteColumn, text, integer, foreignKey, uniqueIndex } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const pacientes = sqliteTable("pacientes", {
	id: text().primaryKey().notNull(),
	nombrePaciente: text("nombre_paciente").notNull(),
	tipoPaciente: text("tipo_paciente").notNull(),
	obraSocial: text("obra_social"),
	sesionesTotales: integer("sesiones_totales").notNull(),
	createdAt: text("created_at"),
});

export const sesionesDiarias = sqliteTable("sesiones_diarias", {
	id: text().primaryKey().notNull(),
	pacienteId: text("paciente_id").references(() => pacientes.id),
	fecha: text().notNull(),
	hora: text().notNull(),
	sentimiento: text().notNull(),
});

export const account = sqliteTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at"),
	refreshTokenExpiresAt: integer("refresh_token_expires_at"),
	scope: text(),
	password: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const session = sqliteTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: integer("expires_at").notNull(),
	token: text().notNull(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
},
(table) => [
	uniqueIndex("session_token_unique").on(table.token),
]);

export const user = sqliteTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: integer("email_verified").notNull(),
	image: text(),
	createdAt: integer("created_at").notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	uniqueIndex("user_email_unique").on(table.email),
]);

export const verification = sqliteTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at"),
	updatedAt: integer("updated_at"),
});

