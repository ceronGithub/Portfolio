-- Create MaintenanceOrder table
CREATE TABLE IF NOT EXISTS "MaintenanceOrder" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "userId"        TEXT NOT NULL,
  "package"       TEXT NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'ACTIVE',
  "bugsUsed"      INTEGER NOT NULL DEFAULT 0,
  "revisionsUsed" INTEGER NOT NULL DEFAULT 0,
  "startedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt"     TIMESTAMP(3) NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MaintenanceOrder_userId_idx" ON "MaintenanceOrder"("userId");

-- Create VCSchedule table
CREATE TABLE IF NOT EXISTS "VCSchedule" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "maintenanceOrderId" TEXT NOT NULL,
  "initiator"          TEXT NOT NULL,
  "buyerName"          TEXT NOT NULL,
  "buyerPhone"         TEXT NOT NULL,
  "preferredDate"      TIMESTAMP(3) NOT NULL,
  "confirmedDate"      TIMESTAMP(3),
  "status"             TEXT NOT NULL DEFAULT 'PENDING',
  "adminNote"          TEXT,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VCSchedule_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "MaintenanceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "VCSchedule_maintenanceOrderId_idx" ON "VCSchedule"("maintenanceOrderId");

-- Create BugReport table
CREATE TABLE IF NOT EXISTS "BugReport" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "maintenanceOrderId" TEXT NOT NULL,
  "title"              TEXT NOT NULL,
  "description"        TEXT NOT NULL,
  "category"           TEXT,
  "status"             TEXT NOT NULL DEFAULT 'SUBMITTED',
  "adminNote"          TEXT,
  "isExtraCharge"      BOOLEAN NOT NULL DEFAULT false,
  "extraChargeAmount"  INTEGER,
  "resolvedAt"         TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BugReport_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "MaintenanceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BugReport_maintenanceOrderId_idx" ON "BugReport"("maintenanceOrderId");

-- Create MaintenanceTask table
CREATE TABLE IF NOT EXISTS "MaintenanceTask" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "maintenanceOrderId" TEXT NOT NULL,
  "title"              TEXT NOT NULL,
  "description"        TEXT,
  "type"               TEXT NOT NULL DEFAULT 'OTHER',
  "status"             TEXT NOT NULL DEFAULT 'PENDING',
  "completedAt"        TIMESTAMP(3),
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MaintenanceTask_maintenanceOrderId_fkey" FOREIGN KEY ("maintenanceOrderId") REFERENCES "MaintenanceOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MaintenanceTask_maintenanceOrderId_idx" ON "MaintenanceTask"("maintenanceOrderId");