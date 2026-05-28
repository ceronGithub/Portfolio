-- AddColumn: adminQuote to Inquiry
-- Stores the admin's official quoted price for a custom request.
-- Separate from estimatedQuote (buyer-calculated) — this is the real number.
ALTER TABLE "Inquiry" ADD COLUMN "adminQuote" INTEGER;
