-- AlterTable: add displayStatus column to System with default "visible"
-- This column controls how a system appears to buyers and visitors:
--   visible     = normal, fully purchasable
--   coming_soon = shows badge, locks buy/configure
--   ongoing     = shows "In Development" badge, locks buy/configure
--   hidden      = not shown on buyer or visitor pages
ALTER TABLE "System" ADD COLUMN IF NOT EXISTS "displayStatus" TEXT NOT NULL DEFAULT 'visible';
