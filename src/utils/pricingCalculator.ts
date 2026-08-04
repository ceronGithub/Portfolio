/**
 * FILE: src/utils/pricingCalculator.ts
 * PURPOSE:
 * Calculates and formats pricing information for design tiers.
 * Supports flexible pricing models: one-time, subscription, and payment-plan.
 * Used by both the visitor configure modal and admin pricing views.
 *
 * DATA FLOW:
 * 1. Component passes a DesignTier object to getFormattedPrice()
 * 2. Function checks pricingType and extracts the relevant fields
 * 3. Returns a human-readable price string + raw values for calculations
 */

export interface DesignTier {
  id: string;
  pricingType: string;
  basePrice?: number | null;
  setupFee?: number | null;
  monthlyFee?: number | null;
  minMonthsLock?: number | null;
  installmentMonths?: number | null;
  installmentAmount?: number | null;
  priceModifier: number;
}

export interface FormattedPrice {
  primary: string;      // Main price display (e.g. "₱350,000" or "₱15,000 + ₱15,000/mo")
  secondary?: string;   // Optional smaller text (e.g. "3-month lock-in" or "36 months")
  raw: {
    total?: number;     // Total cost over entire contract period (for comparison)
    monthly?: number;   // Monthly cost if applicable
    upfront?: number;   // Upfront cost if applicable
  };
}

/**
 * formatPrice
 * Converts a raw PHP number to a formatted price string with peso sign.
 * Handles thousands separators for readability.
 *
 * @example formatPrice(350000) => "₱350,000"
 * @example formatPrice(15000) => "₱15,000"
 */
export function formatPrice(amount: number | null | undefined): string {
  if (!amount) return "Custom pricing";
  return `₱${amount.toLocaleString("en-PH")}`;
}

/**
 * getFormattedPrice
 * Main function to calculate and format a tier's price based on its pricingType.
 * Handles three pricing models:
 *   1. one-time: single payment (basePrice)
 *   2. subscription: setup fee + recurring monthly fee with lock-in period
 *   3. payment-plan: fixed monthly installments over N months
 *
 * @param tier - The DesignTier object from the database
 * @returns FormattedPrice object with primary/secondary strings and raw numbers
 */
export function getFormattedPrice(tier: DesignTier): FormattedPrice {
  const pricingType = tier.pricingType || "one-time";

  // ── ONE-TIME PRICING ─────────────────────────────────────────────────────
  if (pricingType === "one-time") {
    const basePrice = tier.basePrice || 0;
    return {
      primary: formatPrice(basePrice),
      secondary: basePrice > 0 ? "One-time payment" : undefined,
      raw: {
        total: basePrice,
      },
    };
  }

  // ── SUBSCRIPTION PRICING ─────────────────────────────────────────────────
  if (pricingType === "subscription") {
    const setupFee = tier.setupFee || 0;
    const monthlyFee = tier.monthlyFee || 0;
    const lockInMonths = tier.minMonthsLock || 3;

    // Primary display: setup fee + monthly fee
    let primary = "";
    if (setupFee > 0 && monthlyFee > 0) {
      primary = `${formatPrice(setupFee)} + ${formatPrice(monthlyFee)}/mo`;
    } else if (monthlyFee > 0) {
      primary = `${formatPrice(monthlyFee)}/mo`;
    } else if (setupFee > 0) {
      primary = formatPrice(setupFee);
    } else {
      primary = "Custom pricing";
    }

    // Secondary: lock-in period
    const secondary = lockInMonths > 0 ? `${lockInMonths}-month lock-in` : undefined;

    // Raw calculations for total cost (setup + monthly × lock-in period)
    const totalAfterLockIn = setupFee + monthlyFee * lockInMonths;

    return {
      primary,
      secondary,
      raw: {
        upfront: setupFee,
        monthly: monthlyFee,
        total: totalAfterLockIn,
      },
    };
  }

  // ── PAYMENT PLAN PRICING ─────────────────────────────────────────────────
  if (pricingType === "payment-plan") {
    const installmentMonths = tier.installmentMonths || 36;
    const installmentAmount = tier.installmentAmount || 0;

    // Primary display: monthly installment amount
    const primary = `${formatPrice(installmentAmount)}/mo`;

    // Secondary: total months
    const secondary = `${installmentMonths} months`;

    // Raw calculations
    const totalCost = installmentAmount * installmentMonths;

    return {
      primary,
      secondary,
      raw: {
        monthly: installmentAmount,
        total: totalCost,
      },
    };
  }

  // Fallback for unknown pricing type
  return {
    primary: "Custom pricing",
    raw: {},
  };
}

/**
 * comparePrices
 * Calculates total cost difference between two tiers for easy comparison.
 * Useful for displaying "save ₱X by upgrading" messaging.
 *
 * @param tier1 - First tier to compare
 * @param tier2 - Second tier to compare
 * @returns Total cost of tier1 minus total cost of tier2 (can be negative)
 */
export function comparePrices(tier1: DesignTier, tier2: DesignTier): number {
  const price1 = getFormattedPrice(tier1);
  const price2 = getFormattedPrice(tier2);

  const total1 = price1.raw.total || 0;
  const total2 = price2.raw.total || 0;

  return total2 - total1;
}

/**
 * getPricingDescription
 * Returns a human-readable explanation of what's included in the price.
 * Used in tooltips, modals, or detail views.
 *
 * @param tier - The DesignTier object
 * @returns Description string (e.g. "Everything included for one payment")
 */
export function getPricingDescription(tier: DesignTier): string {
  const pricingType = tier.pricingType || "one-time";

  if (pricingType === "one-time") {
    return "Everything included in one payment. Full project handover.";
  }

  if (pricingType === "subscription") {
    const lockInMonths = tier.minMonthsLock || 3;
    return `Managed service with month-to-month renewal after ${lockInMonths}-month minimum commitment. Vic owns infrastructure.`;
  }

  if (pricingType === "payment-plan") {
    const months = tier.installmentMonths || 36;
    return `Spread payments over ${months} months. Full ownership upon final payment. Vic owns infrastructure until final payment.`;
  }

  return "Contact for pricing details";
}