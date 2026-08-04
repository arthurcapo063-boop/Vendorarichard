"use client";

import { useEffect } from "react";
import { useCart } from "@/components/providers";

/** Clears the local cart once the checkout success page is reached. */
export function SuccessCleaner() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}
