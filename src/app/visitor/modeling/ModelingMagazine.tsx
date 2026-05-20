// ModelingMagazine — Visitor > Modeling > Magazine/videos section.
// Standalone wrapper for the MagazineSection blocks and OBJ notes.
// Rendered directly in page.tsx after ModelingIntro, no nesting.

"use client";

import "./modeling-section.css";

interface ModelingMagazineProps {
  children: React.ReactNode;
}

export default function ModelingMagazine({ children }: ModelingMagazineProps) {
  return (
    <div className="modelMagazine">
      {children}
    </div>
  );
}