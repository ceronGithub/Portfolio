-- Add extra animation/action URL slots to Product (actionFour–actionSeven)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "actionFourUrl"  TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "actionFiveUrl"  TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "actionSixUrl"   TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "actionSevenUrl" TEXT;
