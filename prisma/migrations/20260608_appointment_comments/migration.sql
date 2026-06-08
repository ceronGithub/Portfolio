-- CreateTable: AppointmentComment
-- Threaded comment system for Appointment records.
-- Root-level comments: parentId IS NULL.
--   role = "ADMIN"  → admin note/comment posted from admin panel
--   role = "BUYER"  → buyer standalone note posted from buyer appointments page
-- Child comments: parentId IS NOT NULL (reply to a root comment).

CREATE TABLE "AppointmentComment" (
    "id"            TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "role"          TEXT NOT NULL,
    "content"       TEXT NOT NULL,
    "parentId"      TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentComment_pkey" PRIMARY KEY ("id")
);

-- Index for fast lookup by appointment
CREATE INDEX "AppointmentComment_appointmentId_idx" ON "AppointmentComment"("appointmentId");

-- Self-referencing FK for nested replies
ALTER TABLE "AppointmentComment"
  ADD CONSTRAINT "AppointmentComment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "AppointmentComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FK to Appointment
ALTER TABLE "AppointmentComment"
  ADD CONSTRAINT "AppointmentComment_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
