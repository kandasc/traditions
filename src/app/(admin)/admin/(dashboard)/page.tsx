import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminHome() {
  const [productsCount, pagesCount] = await Promise.all([
    prisma.product.count(),
    prisma.page.count(),
  ]);

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Produits</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">
          {productsCount}
        </p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/products"
        >
          Gérer les produits →
        </Link>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="text-sm text-zinc-600">Pages</p>
        <p className="mt-2 text-3xl font-semibold text-zinc-950">{pagesCount}</p>
        <Link
          className="mt-4 inline-flex text-sm font-semibold text-zinc-950 hover:underline"
          href="/admin/pages"
        >
          Gérer les pages →
        </Link>
      </div>
    </div>
  );
}

