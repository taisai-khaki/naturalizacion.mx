import "dotenv/config";
import path from "path";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { db, isLocal } from "../src/db/index.js";

async function main() {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (isLocal) {
    await migratePglite(db, { migrationsFolder });
  } else {
    await migratePg(db, { migrationsFolder });
  }
  console.log("Migraciones aplicadas desde:", migrationsFolder);
}

main()
  .then(() => {
    console.log("Listo.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
