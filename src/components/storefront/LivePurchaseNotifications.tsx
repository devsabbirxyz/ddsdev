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
  const [navHidden, setNavHidden] = useState(false);

  // Mirror MobileBottomNav scroll behavior: nav shows when scrolling up / at top,
  // hides when scrolling down. Show notification on mobile only when nav is hidden.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      if (y < 40) setNavHidden(false);
      else if (dy > 6) setNavHidden(true);
      else if (dy < -6) setNavHidden(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
      className={`fixed z-40 left-2 sm:left-6 bottom-3 sm:bottom-8 max-w-[calc(100vw-1rem)] sm:max-w-md w-[19rem] sm:w-[26rem] transition-all duration-500 ${
        visible && (navHidden || typeof window === "undefined" || window.matchMedia("(min-width: 640px)").matches)
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-6 scale-95 pointer-events-none"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-background/95 via-background/90 to-primary/10 backdrop-blur-xl shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.45)]">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />

        {/* Top ribbon */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-background/40">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            লাইভ অর্ডার
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="h-6 w-6 grid place-items-center rounded-full hover:bg-accent text-muted-foreground transition"
            aria-label="বন্ধ করুন"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-4 flex items-start gap-4 relative">
          <div className="shrink-0 relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-brand grid place-items-center shadow-lg shadow-primary/30">
              <Sparkles className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 grid place-items-center ring-2 ring-background">
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm sm:text-base font-bold text-foreground truncate">
              {p.name}
              {p.city ? <span className="text-muted-foreground font-normal text-xs sm:text-sm"> · {p.city}</span> : null}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug">
              মাত্র কিনেছেন{" "}
              <span className="text-foreground font-semibold">{p.productTitle}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-semibold border border-emerald-500/30">
                ✓ ভেরিফায়েড
              </span>
              <span className="text-muted-foreground">{timeAgoBn(p.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
