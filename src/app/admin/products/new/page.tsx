"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { ProductForm } from "../product-form";

export default function NewProductPage() {
  const [cats, setCats] = useState<{ id: number; name: string }[] | null>(null);

  useEffect(() => {
    api<{ categories: { id: number; name: string }[] }>("/api/admin/categories")
      .then((d) => setCats(d.categories))
      .catch(() => setCats([]));
  }, []);

  return (
    <div>
      <p className="section-kicker">Catalog</p>
      <h1 className="section-title mt-1">Add product</h1>
      <div className="mt-6">
        {cats === null ? (
          <div className="space-y-4">
            <div className="skeleton h-48 rounded-2xl" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
        ) : (
          <ProductForm categories={cats} />
        )}
      </div>
    </div>
  );
}
