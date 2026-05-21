/**
 * Migra datos de la columna antigua pacientes.obra_social (texto)
 * hacia pacientes.obra_social_id antes de que db:push elimine la columna vieja.
 *
 * Uso: npm run db:migrate-obra-social
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { randomUUID } from "crypto";
import { pacientes, obras_sociales } from "../src/lib/schema";

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN en .env");
  process.exit(1);
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

async function columnExists(table: string, column: string): Promise<boolean> {
  const rows = await client.execute(`PRAGMA table_info(${table})`);
  return rows.rows.some((row) => row.name === column);
}

async function main() {
  const hasOldColumn = await columnExists("pacientes", "obra_social");

  if (!hasOldColumn) {
    console.log("La columna pacientes.obra_social ya no existe. Nada que migrar.");
    return;
  }

  const pending = await client.execute(`
    SELECT id, obra_social, obra_social_id
    FROM pacientes
    WHERE obra_social IS NOT NULL
      AND trim(obra_social) != ''
      AND (obra_social_id IS NULL OR trim(obra_social_id) = '')
  `);

  if (pending.rows.length === 0) {
    console.log("No hay pacientes con obra_social sin obra_social_id.");
    return;
  }

  console.log(`Migrando ${pending.rows.length} paciente(s)...`);

  const allObras = await db.select().from(obras_sociales).all();
  const obrasByNombre = new Map(
    allObras.map((o) => [o.nombre.trim().toLowerCase(), o.id])
  );

  for (const row of pending.rows) {
    const pacienteId = row.id as string;
    const nombreObra = (row.obra_social as string).trim();
    const key = nombreObra.toLowerCase();

    let obraSocialId = obrasByNombre.get(key);

    if (!obraSocialId) {
      obraSocialId = randomUUID();
      await db.insert(obras_sociales).values({
        id: obraSocialId,
        nombre: nombreObra,
        created_at: new Date().toISOString(),
      });
      obrasByNombre.set(key, obraSocialId);
      console.log(`  + Obra social creada: "${nombreObra}"`);
    }

    await client.execute({
      sql: `UPDATE pacientes SET obra_social_id = ? WHERE id = ?`,
      args: [obraSocialId, pacienteId],
    });
    console.log(`  ✓ Paciente ${pacienteId} → obra_social_id`);
  }

  console.log("\nMigración lista. Ahora podés ejecutar: npm run db:push");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
