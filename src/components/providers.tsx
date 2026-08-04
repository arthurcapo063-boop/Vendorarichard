"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cartLineTotal, type CartItem } from "@/lib/types";

/* ---------------- Theme ---------------- */

type Theme = "light" | "dark";
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

/* ---------------- Toasts ---------------- */

interface ToastMsg {
  id: number;
  msg: string;
  kind: "ok" | "err" | "info";
}
const ToastCtx = createContext<{ toast: (msg: string, kind?: ToastMsg["kind"]) => void }>({
  toast: () => {},
});

/* ---------------- Cart ---------------- */

interface CartApi {
  items: CartItem[];
  count: number;
  estimate: number;
  add: (item: CartItem) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
}
const CartCtx = createContext<CartApi | null>(null);

const CART_KEY = "vd-cart";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore corrupted cart */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* storage full */
    }
  }, [items]);

  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("vd-theme", next);
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const toast = useCallback((msg: string, kind: ToastMsg["kind"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const found = prev.find((p) => p.key === item.key);
      if (found) {
        return prev.map((p) => (p.key === item.key ? { ...p, qty: p.qty + item.qty } : p));
      }
      return [...prev, item];
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.key !== key)
        : prev.map((p) => (p.key === key ? { ...p, qty: Math.min(99, qty) } : p))
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const estimate = useMemo(() => items.reduce((s, i) => s + cartLineTotal(i), 0), [items]);

  const cartApi: CartApi = {
    items,
    count,
    estimate,
    add,
    setQty,
    remove,
    clear,
    drawerOpen,
    setDrawerOpen,
  };

  return (
    <ThemeCtx.Provider value={{ theme, toggle }}>
      <ToastCtx.Provider value={{ toast }}>
        <CartCtx.Provider value={cartApi}>
          {children}
          {/* toast stack */}
          <div className="pointer-events-none fixed bottom-5 left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className={`animate-pop pointer-events-auto w-full rounded-xl border px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-md ${
                  t.kind === "err"
                    ? "border-red-400/40 bg-red-500/95 text-white"
                    : t.kind === "info"
                      ? "glass border-line text-ink"
                      : "border-brand/40 bg-surface/95 text-ink"
                }`}
                style={t.kind === "ok" ? { borderLeft: "4px solid var(--brand)" } : undefined}
              >
                {t.msg}
              </div>
            ))}
          </div>
        </CartCtx.Provider>
      </ToastCtx.Provider>
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
export function useToast() {
  return useContext(ToastCtx);
}
export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart outside StoreProvider");
  return ctx;
}
