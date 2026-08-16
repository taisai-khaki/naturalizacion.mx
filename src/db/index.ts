import path from "path";
import { Pool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __pgPool?: Pool;
  __pglite?: PGlite;
};

// true cuando se corre localmente (sin base de datos externa)
export const isLocal = !databaseUrl;

let client: Pool | PGlite;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;

if (databaseUrl) {
  // Producción: PostgreSQL real (Neon, Supabase, Vercel Postgres, etc.)
  const pool = globalForDb.__pgPool ?? new Pool({ connectionString: databaseUrl });
  if (process.env.NODE_ENV !== "production") globalForDb.__pgPool = pool;
  client = pool;
  db = drizzlePg(pool);
} else {
  // Local / preview: PostgreSQL embebido (PGlite) — mismo dialecto y schema
  const dataDir = path.join(process.cwd(), ".pglite");
  const pglite = globalForDb.__pglite ?? new PGlite(dataDir);
  if (process.env.NODE_ENV !== "production") globalForDb.__pglite = pglite;
  client = pglite;
  db = drizzlePglite(pglite);
}

export { db, client };
