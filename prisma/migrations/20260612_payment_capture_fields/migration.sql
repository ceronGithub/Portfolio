-- Add PayMongo payment capture fields to Order table (Rule 30 — Protocol v34)
-- paymongoPaymentId: PayMongo payment ID set by webhook on successful payment
-- paymentStatus: PayMongo payment status string ("paid") set by webhook
-- paidAt: timestamp of payment confirmation set by webhook

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymongoPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
