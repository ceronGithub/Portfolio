-- Fix tier price distribution: mesh_only = 45%, standard = 75%, full_pack = 100%
UPDATE "Product" SET
  "priceMeshOnly" = ROUND("priceFullPack" * 0.45),
  "priceStandard"  = ROUND("priceFullPack" * 0.75);
