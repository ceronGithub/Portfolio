-- CreateTable: DesignTier
-- Stores website design style options (Static, Dynamic, Modern, AI-Powered) per System.
-- priceModifier is added on top of the system basePrice when the buyer selects this tier.

CREATE TABLE "DesignTier" (
    "id"            TEXT NOT NULL,
    "systemId"      TEXT NOT NULL,
    "name"          TEXT NOT NULL,
    "slug"          TEXT NOT NULL,
    "tagline"       TEXT,
    "priceModifier" INTEGER NOT NULL DEFAULT 0,
    "demoVideoUrl"  TEXT,
    "liveUrl"       TEXT,
    "sortOrder"     INTEGER NOT NULL DEFAULT 0,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignTier_systemId_idx" ON "DesignTier"("systemId");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "DesignTier_systemId_slug_key" ON "DesignTier"("systemId", "slug");

-- AddForeignKey
ALTER TABLE "DesignTier" ADD CONSTRAINT "DesignTier_systemId_fkey"
    FOREIGN KEY ("systemId") REFERENCES "System"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
