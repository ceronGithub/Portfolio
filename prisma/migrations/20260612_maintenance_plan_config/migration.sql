-- CreateTable: MaintenancePlan
-- Stores admin-configurable pricing and usage limits per maintenance package.
-- Seeded immediately with default values matching the original hardcoded PKG_CONFIG.

CREATE TABLE "MaintenancePlan" (
    "id"            TEXT NOT NULL,
    "package"       TEXT NOT NULL,
    "price"         INTEGER NOT NULL,
    "bugLimit"      INTEGER NOT NULL,
    "revisionLimit" INTEGER NOT NULL,
    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on package so BASIC/PRIORITY/FULL only have one row each
CREATE UNIQUE INDEX "MaintenancePlan_package_key" ON "MaintenancePlan"("package");

-- Seed default values
INSERT INTO "MaintenancePlan" ("id", "package", "price", "bugLimit", "revisionLimit") VALUES
    (gen_random_uuid()::text, 'BASIC',    4500,  3, 2),
    (gen_random_uuid()::text, 'PRIORITY', 8500,  5, 4),
    (gen_random_uuid()::text, 'FULL',     15000, 8, 6);
