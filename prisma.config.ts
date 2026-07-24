// Prisma 7 CLI config — used by `npx prisma db push` / `generate` / seed.
// Prisma 7 no longer auto-loads .env, so dotenv/config is required here.
// url uses DIRECT_URL (session pooler, port 5432) — this is what Migrate/CLI
// operations use for a stable session; the transaction pooler (DATABASE_URL)
// doesn't reliably support the prepared statements these operations need.
// Never used at app runtime — src/lib/prisma.ts uses DATABASE_URL instead.
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seedSystems.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
