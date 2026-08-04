/**
 * FILE: app/visitor/showcase/ShowcaseClient.jsx
 * ROLE: Visitor — public, interactive (Client Component)
 *
 * PURPOSE:
 * Renders the "Configure & price live" style tier selector. Visitor
 * picks one of the four Villa Azure service tiers on the left; the
 * package details panel below it swaps to show that tier's own
 * inclusions (each tier has a different list — there is no shared
 * "included in every tier" section). The right-hand sidebar mirrors
 * the selection as a running summary and exposes the Proceed action.
 *
 * DATA FLOW:
 * 1. Visitor lands on /visitor/showcase — tiers list is imported
 *    directly from utils/villaAzureShowcaseTiers.js (static content,
 *    no database round-trip needed for four fixed rows)
 * 2. Clicking a tier card updates local selectedTierId state — no
 *    server call, this is pure UI selection
 * 3. Package details panel and sidebar both derive from the same
 *    selectedTier object, so they can never fall out of sync
 * 4. "Proceed" links into the existing /visitor/booking flow with the
 *    chosen tier passed as a query param, reusing that page rather
 *    than building a second checkout flow
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { VILLA_AZURE_SHOWCASE_TIERS } from "@/utils/villaAzureShowcaseTiers";

export default function ShowcaseClient() {
  // Tracks which tier card is currently selected — defaults to the first tier
  const [selectedTierId, setSelectedTierId] = useState(VILLA_AZURE_SHOWCASE_TIERS[0].id);

  const selectedTier =
    VILLA_AZURE_SHOWCASE_TIERS.find((tier) => tier.id === selectedTierId) ??
    VILLA_AZURE_SHOWCASE_TIERS[0];

  return (
    <div className="showcaseConfigurator">
      <div className="showcaseColumns">
        <div className="showcaseMain">
          <p className="showcaseSectionLabel">Service tier</p>

          <div className="showcaseTierList" role="radiogroup" aria-label="Service tier">
            {VILLA_AZURE_SHOWCASE_TIERS.map((tier) => {
              const isActive = tier.id === selectedTierId;
              return (
                <button
                  key={tier.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  className={isActive ? "showcaseTierCard showcaseTierCardActive" : "showcaseTierCard"}
                  onClick={() => setSelectedTierId(tier.id)}
                >
                  <span className="showcaseTierCardTop">
                    <span className="showcaseTierName">{tier.name}</span>
                    <span className="showcaseTierPrice">{tier.priceLabel}</span>
                  </span>
                  <span className="showcaseTierNote">{tier.priceNote}</span>
                </button>
              );
            })}
          </div>

          <p className="showcaseSectionLabel showcaseDetailsLabel">
            Package details — {selectedTier.name.split("— ")[1]}
          </p>

          <ul className="showcaseDetailsList">
            {selectedTier.packageDetails.map((detail) => (
              <li key={detail} className="showcaseDetailItem">
                {/* Decorative check — the list item text already conveys meaning */}
                <Check aria-hidden="true" className="showcaseDetailIcon" size={16} />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="showcaseSidebar">
          <p className="showcaseSidebarLabel">Your build</p>
          <p className="showcaseSidebarTierName">{selectedTier.name}</p>
          <p className="showcaseSidebarPrice">{selectedTier.priceLabel}</p>
          <p className="showcaseSidebarNote">{selectedTier.priceNote}</p>

          <Link
            href={`/visitor/booking?tier=${selectedTier.id}`}
            className="showcaseProceedButton"
          >
            Proceed
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
