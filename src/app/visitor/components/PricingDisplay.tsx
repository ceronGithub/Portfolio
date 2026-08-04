/**
 * FILE: visitor/components/PricingDisplay.tsx
 * ROLE: Visitor — public component used inside the configure modal
 *
 * PURPOSE:
 * Displays pricing information for the selected design tier.
 * Supports three flexible pricing models:
 *   1. one-time: single payment
 *   2. subscription: setup fee + monthly recurring fee with lock-in
 *   3. payment-plan: fixed monthly installments over N months
 *
 * USAGE:
 * <​PricingDisplay tier={selectedTier} />
 *
 * DATA FLOW:
 * 1. Parent (SystemsShowcase) passes the selected DesignTier
 * 2. Component detects pricingType and renders accordingly
 * 3. Displays primary price, secondary details, and total cost
 */

"use client";

import { getFormattedPrice, getPricingDescription } from "@/utils/pricingCalculator";
import type { DesignTier } from "@/utils/pricingCalculator";

interface PricingDisplayProps {
  tier: DesignTier;
  showDescription?: boolean;
}

/**
 * PricingDisplay
 * Renders the pricing information for a design tier in the modal.
 * Adapts its display based on the tier's pricingType.
 */
export function PricingDisplay({ tier, showDescription = true }: PricingDisplayProps) {
  const formatted = getFormattedPrice(tier);
  const description = getPricingDescription(tier);

  return (
    <div className="vPricingDisplay">
      {/* Primary price — large, main display */}
      <div className="vPricingPrimary">
        <span className="vPricingPrimaryLabel">Price</span>
        <span className="vPricingPrimaryValue">{formatted.primary}</span>
      </div>

      {/* Secondary details — smaller text for lock-in, payment terms, etc. */}
      {formatted.secondary && (
        <div className="vPricingSecondary">
          {formatted.secondary}
        </div>
      )}

      {/* Total cost breakdown — shown for subscription & payment-plan */}
      {(tier.pricingType === "subscription" || tier.pricingType === "payment-plan") && formatted.raw.total && (
        <div className="vPricingTotal">
          <span className="vPricingTotalLabel">Total cost:</span>
          <span className="vPricingTotalValue">₱{(formatted.raw.total || 0).toLocaleString("en-PH")}</span>
        </div>
      )}

      {/* Description — explains what's included and terms */}
      {showDescription && (
        <p className="vPricingDescription">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * PricingComparison
 * Optional component to show pricing comparison between two tiers.
 * Useful for "save X by upgrading" messaging.
 */
interface PricingComparisonProps {
  tier1: DesignTier;
  tier1Label: string;
  tier2: DesignTier;
  tier2Label: string;
}

export function PricingComparison({ tier1, tier1Label, tier2, tier2Label }: PricingComparisonProps) {
  const price1 = getFormattedPrice(tier1);
  const price2 = getFormattedPrice(tier2);

  const total1 = price1.raw.total || 0;
  const total2 = price2.raw.total || 0;

  const difference = Math.abs(total2 - total1);
  const tier2IsCheaper = total2 < total1;

  return (
    <div className="vPricingComparison">
      <div className="vPricingComparisonRow">
        <span className="vPricingComparisonLabel">{tier1Label}</span>
        <span className="vPricingComparisonPrice">₱{total1.toLocaleString("en-PH")}</span>
      </div>
      <div className="vPricingComparisonRow">
        <span className="vPricingComparisonLabel">{tier2Label}</span>
        <span className="vPricingComparisonPrice">₱{total2.toLocaleString("en-PH")}</span>
      </div>
      {difference > 0 && (
        <div className="vPricingComparisonSavings">
          <span className={tier2IsCheaper ? "savings" : "upsell"}>
            {tier2IsCheaper ? "Save" : "Difference"}:{" "}
            <strong>₱{difference.toLocaleString("en-PH")}</strong>
          </span>
        </div>
      )}
    </div>
  );
}