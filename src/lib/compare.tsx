import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CompareItem = {
  id: string;
  slug: string;
  title: string;
  image?: string | null;
  price?: number | null;
  regularPrice?: number | null;
  rating?: number | null;
  totalReviews?: number | null;
  stockQuantity?: number | null;
  trackStock?: boolean | null;
  sellerName?: string | null;
  shortDescription?: string | null;
};

type CompareCtx = {
  items: CompareItem[];
  has: (id: string) => boolean;
  toggle: (item: CompareItem) => { added: boolean; reason?: string };
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const MAX = 3;
const KEY = "dds-compare-v1";

const Ctx = createContext<CompareCtx>({
  items: [], has: () => false, toggle: () => ({ added: false }),
  remove: () => {}, clear: () => {}, open: false, setOpen: () => {},
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items, ready]);

  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);

  const toggle = useCallback((item: CompareItem) => {
    let result: { added: boolean; reason?: string } = { added: false };
    setItems((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      if (exists) {
        result = { added: false };
        return prev.filter((p) => p.id !== item.id);
      }
      if (prev.length >= MAX) {
        result = { added: false, reason: `সর্বোচ্চ ${MAX}টি প্রোডাক্ট তুলনা করা যাবে` };
        return prev;
      }
      result = { added: true };
      return [...prev, item];
    });
    return result;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CompareCtx>(() => ({ items, has, toggle, remove, clear, open, setOpen }), [items, has, toggle, remove, clear, open]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCompare = () => useContext(Ctx);
export const COMPARE_MAX = MAX;
