-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Appointment" (
    "id"             TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "buyerName"      TEXT NOT NULL,
    "buyerEmail"     TEXT NOT NULL,
    "systemId"       TEXT NOT NULL,
    "systemTitle"    TEXT NOT NULL,
    "basePrice"      INTEGER NOT NULL,
    "selectedAddons" JSONB NOT NULL,
    "quotedPrice"    INTEGER NOT NULL,
    "scheduledDate"  TEXT NOT NULL,
    "message"        TEXT,
    "referenceNo"    TEXT NOT NULL,
    "status"         "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote"      TEXT,
    "userId"         TEXT NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_referenceNo_key" ON "Appointment"("referenceNo");
CREATE INDEX "Appointment_userId_idx" ON "Appointment"("userId");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
