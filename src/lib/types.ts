export interface ProductLite {
  id: number;
  name: string;
  slug: string;
  description: string;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  image: string;
  basePrice: number;
  salePrice: number | null;
  stockQty: number | null;
  soldOut: boolean;
  isFlashSale: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface CartAttribute {
  name: string;
  value: string;
  priceDelta: number;
}

export interface CartItem {
  key: string;
  productId: number;
  name: string;
  slug: string;
  image: string;
  unitPrice: number;
  qty: number;
  attributeIds: number[];
  attributes: CartAttribute[];
  fees: { feeName: string; feeAmount: number }[];
}

export function cartLineTotal(item: CartItem): number {
  const attrDelta = item.attributes.reduce((s, a) => s + a.priceDelta, 0);
  const feeSum = item.fees.reduce((s, f) => s + f.feeAmount, 0);
  return (item.unitPrice + attrDelta + feeSum) * item.qty;
}

export type OrderStatus = "pending" | "processing" | "cancelled" | "completed";
