// Seeds the database with an ADMIN and a BUYER user for testing.
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Prisma 7 requires a driver adapter — bare PrismaClient() no longer connects.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const buyerPassword = await bcrypt.hash("buyer123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@matthew-studio.com" },
    update: {},
    create: {
      email: "admin@matthew-studio.com",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@matthew-studio.com" },
    update: {},
    create: {
      email: "buyer@matthew-studio.com",
      name: "Test Buyer",
      password: buyerPassword,
      role: "BUYER",
    },
  });

  console.log("Seeded:", admin.email, buyer.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());