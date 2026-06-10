-- Make productId nullable on Order (was NOT NULL in init, schema says optional)
ALTER TABLE "Order" ALTER COLUMN "productId" DROP NOT NULL;

-- Add systemId column (nullable — set for System orders, null for Product orders)
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "systemId" TEXT;

-- Add foreign key from Order.systemId → System.id
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_systemId_fkey";
ALTER TABLE "Order" ADD CONSTRAINT "Order_systemId_fkey"
  FOREIGN KEY ("systemId") REFERENCES "System"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Index for fast lookup by systemId
CREATE INDEX IF NOT EXISTS "Order_systemId_idx" ON "Order"("systemId");