"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { ProductForm, type ProductFormInitial } from "../../product-form";

interface Cat {
  id: number;
  name: string;
}

export function EditProductClient({ id }: { id: number }) {
  const [data, setData] = useState<(ProductFormInitial & { cats: Cat[] }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<ProductFormInitial>(`/api/admin/products?id=${id}`),
      api<{ categories: Cat[] }>("/api/admin/categories"),
    ])
      .then(([init, c]) => setData({ ...init, cats: c.categories }))
      .catch((e) => setError((e as Error).message));
  }, [id]);

  if (error) return <p className="rounded-xl bg-red-500/10 p-4 text-sm font-semibold text-red-500">{error}</p>;

  return (
    <div>
      <p className="section-kicker">Catalog</p>
      <h1 className="section-title mt-1">Edit product</h1>
      <div className="mt-6">
        {data === null ? (
          <div className="space-y-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
        ) : (
          <ProductForm categories={data.cats} initial={data} />
        )}
      </div>
    </div>
  );
}
