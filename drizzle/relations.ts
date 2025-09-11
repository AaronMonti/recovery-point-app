import { relations } from "drizzle-orm/relations";
import { pacientes, sesionesDiarias, user, account, session, categorias, obras_sociales } from "./schema";

export const sesionesDiariasRelations = relations(sesionesDiarias, ({one}) => ({
	paciente: one(pacientes, {
		fields: [sesionesDiarias.pacienteId],
		references: [pacientes.id]
	}),
}));

export const pacientesRelations = relations(pacientes, ({many, one}) => ({
	sesionesDiarias: many(sesionesDiarias),
	categoria: one(categorias, {
		fields: [pacientes.categoriaId],
		references: [categorias.id]
	}),
	obraSocial: one(obras_sociales, {
		fields: [pacientes.obraSocialId],
		references: [obras_sociales.id]
	}),
}));

export const categoriasRelations = relations(categorias, ({many}) => ({
	pacientes: many(pacientes),
}));

export const obrasSocialesRelations = relations(obras_sociales, ({many}) => ({
	pacientes: many(pacientes),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));