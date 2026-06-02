-- Migration: add adminComment and buyerComment fields to Inquiry table
ALTER TABLE "Inquiry" ADD COLUMN "adminComment" TEXT;
ALTER TABLE "Inquiry" ADD COLUMN "buyerComment" TEXT;
