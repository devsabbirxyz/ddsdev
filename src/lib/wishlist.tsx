import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type WishItem = {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image?: string | null;
};

type WishCtx = {
  items: WishItem[];
  has: (id: string) => boolean;
  toggle: (item: WishItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<WishCtx>({ items: [], has: () => false, toggle: () => {}, remove: () => {}, clear: () => {} });
const KEY = "dds-wishlist-v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null; if (raw) setItems(JSON.parse(raw)); } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }, [items, ready]);

  const has = useCallback((id: string) => items.some((i) => i.productId === id), [items]);
  const remove = useCallback((id: string) => setItems((p) => p.filter((i) => i.productId !== id)), []);
  const toggle = useCallback((item: WishItem) => setItems((p) => p.some((i) => i.productId === item.productId) ? p.filter((i) => i.productId !== item.productId) : [...p, item]), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<WishCtx>(() => ({ items, has, toggle, remove, clear }), [items, has, toggle, remove, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWishlist = () => useContext(Ctx);
