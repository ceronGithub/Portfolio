-- Migration: Appointment soft-delete + bi-directional comment thread
-- Task 2: Buyer can remove PENDING appointments (soft-delete via deletedAt)
-- Task 3: Bi-directional threaded comments on appointments

-- ── Soft-delete column ────────────────────────────────────────────────────
ALTER TABLE "Appointment" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- ── AppointmentComment thread ─────────────────────────────────────────────
CREATE TABLE "AppointmentComment" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "role"          TEXT NOT NULL,        -- 'ADMIN' | 'BUYER'
  "content"       TEXT NOT NULL,
  "parentId"      TEXT,                 -- null = root; non-null = reply
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentComment_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AppointmentComment_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "AppointmentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "AppointmentComment_appointmentId_idx" ON "AppointmentComment"("appointmentId");
