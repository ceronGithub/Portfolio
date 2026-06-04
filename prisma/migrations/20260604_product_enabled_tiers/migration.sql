-- Add enabledTiers column to Product with default all tiers enabled
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "enabledTiers" TEXT NOT NULL DEFAULT 'mesh_only,standard,full_pack';
