import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import { getRecentPurchases } from "@/lib/live-purchases.functions";

type Purchase = {
  name: string;
  city: string | null;
  productTitle: string;
  createdAt: string;
};

function timeAgoBn(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.max(1, Math.floor(diffMs / 60000));
  if (min < 60) return `${min} মিনিট আগে`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ঘণ্টা আগে`;
  const d = Math.floor(hr / 24);
  return `${d} দিন আগে`;
}

export function LivePurchaseNotifications() {
  const { data } = useQuery({
    queryKey: ["live-purchases"],
    queryFn: () => getRecentPurchases(),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const purchases = useMemo<Purchase[]>(() => data?.purchases ?? [], [data]);
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed || purchases.length === 0) return;
    let cancelled = false;

    // First show after 8s, then rotate every ~15s (7s visible + 8s gap)
    const cycle = async () => {
      await new Promise((r) => setTimeout(r, 8000));
      while (!cancelled) {
        if (cancelled) return;
        setVisible(true);
        await new Promise((r) => setTimeout(r, 7000));
        if (cancelled) return;
        setVisible(false);
        await new Promise((r) => setTimeout(r, 8000));
        if (cancelled) return;
        setIdx((i) => (i + 1) % Math.max(1, purchases.length));
      }
    };
    void cycle();
    return () => {
      cancelled = true;
    };
  }, [purchases.length, dismissed]);

  if (dismissed || purchases.length === 0) return null;
  const p = purchases[idx % purchases.length];
  if (!p) return null;

  return (
    <div
      className={`fixed z-40 left-3 sm:left-5 bottom-24 sm:bottom-6 max-w-[calc(100vw-1.5rem)] sm:max-w-sm transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="glass-card rounded-2xl p-3 pr-8 shadow-glow border border-border/60 flex items-start gap-3 relative">
        <div className="shrink-0 h-10 w-10 rounded-xl bg-gradient-brand grid place-items-center">
          <ShoppingBag className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0 text-xs sm:text-sm">
          <div className="font-semibold text-foreground truncate">
            {p.name}
            {p.city ? <span className="text-muted-foreground font-normal"> · {p.city}</span> : null}
          </div>
          <div className="text-muted-foreground truncate">
            মাত্র কিনেছেন <span className="text-foreground font-medium">{p.productTitle}</span>
          </div>
          <div className="text-[10px] text-muted-foreground/80 mt-0.5 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {timeAgoBn(p.createdAt)} · ভেরিফায়েড অর্ডার
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 h-6 w-6 grid place-items-center rounded-full hover:bg-accent text-muted-foreground"
          aria-label="বন্ধ করুন"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
