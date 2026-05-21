// admin/products/page.tsx — Product / System Management page.
// Lists all products (systems) with active status, base price,
// add-on count. Allows toggling isActive via client action.
// Protected: ADMIN only.
import { prisma }           from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions }      from "@/lib/auth";
import { redirect }         from "next/navigation";
import AdminShell           from "@/components/AdminShell";
import ProductsClient       from "./ProductsClient";
import "./products.css";

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const adminName = session.user?.name ?? session.user?.email ?? "Admin";

  // Fetch all products (legacy Product model) and all Systems with addons
  const [products, systems] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.system.findMany({
      orderBy: { createdAt: "asc" },
      include: { addons: { orderBy: [{ category: "asc" }, { label: "asc" }] } },
    }),
  ]);

  return (
    <AdminShell adminName={adminName}>
      <ProductsClient products={products} systems={systems} />
    </AdminShell>
  );
}