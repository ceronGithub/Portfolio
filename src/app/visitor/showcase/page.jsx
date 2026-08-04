/**
 * FILE: app/visitor/showcase/page.jsx
 * ROLE: Visitor — public, standalone page (same tier as /visitor/rooms)
 *
 * PURPOSE:
 * Entry point for the service tier showcase — lets a prospective
 * client compare Villa Azure's four engagement tiers (Managed Rental,
 * Full Buyout, Build-to-Own, Full Custom) and see each tier's own
 * package details before proceeding. All interactivity (tier
 * selection, details panel, sidebar summary) lives in the Client
 * Component below — this file stays a plain Server Component since
 * it has nothing to fetch and nothing to react to.
 *
 * DATA FLOW:
 * 1. Visitor hits "/visitor/showcase"
 * 2. This Server Component renders the static page header, then
 *    mounts <ShowcaseClient /> for the interactive part
 * 3. ShowcaseClient reads tier data from utils/villaAzureShowcaseTiers.js
 */
import ShowcaseClient from "./ShowcaseClient";
import "./Showcase.css";

export const metadata = {
  title: "Showcase | your-private-resort",
  description: "Compare Villa Azure service tiers and see what each one includes.",
};

export default function VisitorShowcasePage() {
  return (
    <main className="showcasePageMain">
      <div className="showcasePageHeader">
        <span className="showcasePageEyebrow">Platform</span>
        <h1 className="showcasePageTitle">Configure & price live.</h1>
        <p className="showcasePageSubtitle">
          Pick a tier to see exactly what it includes.
        </p>
      </div>

      <ShowcaseClient />
    </main>
  );
}
