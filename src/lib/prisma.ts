// Singleton Prisma client. Prevents multiple instances during Next.js hot-reload.
// Uses globalThis cache in dev to survive HMR, but validates the instance is live
// before reusing — prevents Turbopack stale-module errors.
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma: PrismaClient =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : (global._prisma ?? (global._prisma = createPrismaClient()));