// buyer/downloads/page.tsx — Server Component.
// Fetches all owned products for the logged-in buyer.
// Renders DownloadsClient with the list.

import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { prisma }           from "@/lib/prisma";
import { redirect }         from "next/navigation";
import DownloadsClient      from "./DownloadsClient";

export default async function DownloadsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;

  const ownerships = await prisma.ownership.findMany({
    where:   { userId },
    orderBy: { grantedAt: "desc" },
    include: { product: true },
  });

  const downloads = ownerships.map(o => ({
    id:          o.id,
    productId:   o.product.id,
    name:        o.product.name,
    description: o.product.description ?? "",
    fileKey:     (o as any).fileKey ?? null,   // fileKey lives on Ownership, not Product
    fileKeyObj:  o.product.fileKeyObj ?? null,
    fileKeyFbx:  o.product.fileKeyFbx ?? null,
    fileKeyGlb:  o.product.fileKeyGlb ?? null,
    grantedAt:   o.grantedAt.toISOString(),
  }));

  return <DownloadsClient downloads={downloads} />;
}