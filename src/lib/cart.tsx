import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image?: string | null;
  variantId?: string | null;
  variantLabel?: string | null;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQty: (productId: string, qty: number, variantId?: string | null) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx>({
  items: [], count: 0, subtotal: 0,
  addItem: () => {}, removeItem: () => {}, updateQty: () => {}, clear: () => {},
});

const STORAGE_KEY = "dds-cart-v1";

function sameLine(a: CartItem, productId: string, variantId?: string | null) {
  return a.productId === productId && (a.variantId ?? null) === (variantId ?? null);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => sameLine(p, item.productId, item.variantId));
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
        return next;
      }
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string | null) => {
    setItems((prev) => prev.filter((p) => !sameLine(p, productId, variantId)));
  }, []);

  const updateQty = useCallback((productId: string, qty: number, variantId?: string | null) => {
    setItems((prev) => prev.map((p) => sameLine(p, productId, variantId) ? { ...p, quantity: Math.max(1, qty) } : p));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, subtotal, addItem, removeItem, updateQty, clear };
  }, [items, addItem, removeItem, updateQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
