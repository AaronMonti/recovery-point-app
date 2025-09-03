import { relations } from "drizzle-orm/relations";
import { pacientes, sesionesDiarias, user, account, session } from "./schema";

export const sesionesDiariasRelations = relations(sesionesDiarias, ({one}) => ({
	paciente: one(pacientes, {
		fields: [sesionesDiarias.pacienteId],
		references: [pacientes.id]
	}),
}));

export const pacientesRelations = relations(pacientes, ({many}) => ({
	sesionesDiarias: many(sesionesDiarias),
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