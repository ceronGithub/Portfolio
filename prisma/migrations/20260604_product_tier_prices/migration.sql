-- Migration: replace single price with 3 tier-based prices on Product
-- Copies existing price into all 3 new columns, then drops the old column.

ALTER TABLE "Product" ADD COLUMN "priceMeshOnly" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "priceStandard"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "priceFullPack"  INTEGER NOT NULL DEFAULT 0;

-- Carry over existing price value into all three tiers
UPDATE "Product" SET
  "priceMeshOnly" = "price",
  "priceStandard"  = "price",
  "priceFullPack"  = "price";

ALTER TABLE "Product" DROP COLUMN "price";
