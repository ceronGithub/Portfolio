// Singleton Prisma client — Turbopack-safe pattern.
// Uses globalThis with a Symbol key to prevent Turbopack module identity conflicts.
// Prisma 7 requires a driver adapter for Postgres — bare PrismaClient() throws
// at query time without one. Uses DATABASE_URL (transaction pooler, port 6543)
// for app runtime queries — never DIRECT_URL here (that's CLI-only, see prisma.config.ts).
// Import path points to the generated client output (see generator block in
// schema.prisma) — Prisma 7's "prisma-client" generator no longer publishes
// to @prisma/client.
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prismaClientSingleton = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;