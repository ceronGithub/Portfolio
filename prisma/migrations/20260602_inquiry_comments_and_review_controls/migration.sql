-- Migration: InquiryComment thread model + Review/Testimonial admin controls
-- Adds threaded comment system to Inquiry.
-- Adds isHidden, isHighlighted, isPinned, adminReply to Review and Testimonial.

-- ── InquiryComment ─────────────────────────────────────────────────────────
CREATE TABLE "InquiryComment" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "inquiryId" TEXT NOT NULL,
  "role"      TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "parentId"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InquiryComment_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "InquiryComment_parentId_fkey"  FOREIGN KEY ("parentId")  REFERENCES "InquiryComment"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "InquiryComment_inquiryId_idx" ON "InquiryComment"("inquiryId");

-- ── Review admin controls ─────────────────────────────────────────────────
ALTER TABLE "Review" ADD COLUMN "isHidden"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN "isHighlighted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN "isPinned"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Review" ADD COLUMN "adminReply"    TEXT;

-- ── Testimonial admin controls ────────────────────────────────────────────
ALTER TABLE "Testimonial" ADD COLUMN "isHidden"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Testimonial" ADD COLUMN "isHighlighted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Testimonial" ADD COLUMN "isPinned"      BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Testimonial" ADD COLUMN "adminReply"    TEXT;
