-- Migration: Appointment soft-delete + bi-directional comment thread

-- ── Soft-delete column ────────────────────────────────────────────────────
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- ── AppointmentComment thread ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "AppointmentComment" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "role"          TEXT NOT NULL,
  "content"       TEXT NOT NULL,
  "parentId"      TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentComment_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AppointmentComment_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "AppointmentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AppointmentComment_appointmentId_idx" ON "AppointmentComment"("appointmentId");
