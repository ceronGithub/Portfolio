// resetAdmin.js — Run with: node resetAdmin.js
// Place in project root, run once, then delete.
// NOTE: Prisma 7's "prisma-client" generator may output ESM-only. If `require()`
// fails here after `npx prisma generate`, run this script with
// `npx tsx resetAdmin.js` instead (or rename to resetAdmin.ts and use import syntax).
require("dotenv/config");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("./src/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// Prisma 7 requires a driver adapter — bare PrismaClient() no longer connects.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash("admin123", 10);

  const user = await prisma.user.upsert({
    where:  { email: "admin@matthew-studio.com" },
    update: { password: hash },
    create: {
      email:    "admin@matthew-studio.com",
      name:     "Admin",
      password: hash,
      role:     "ADMIN",
    },
  });

  console.log("✓ Admin password reset for:", user.email);
  console.log("  Email:    admin@matthew-studio.com");
  console.log("  Password: admin123");
}

main()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());
