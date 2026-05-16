// resetAdmin.js — Run with: node resetAdmin.js
// Place in project root, run once, then delete.
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

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
