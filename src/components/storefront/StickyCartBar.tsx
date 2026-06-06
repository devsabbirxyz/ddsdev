import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/storefront";

export function StickyCartBar() {
  const { items, count, subtotal } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hidden =
    loc.pathname.startsWith("/cart") ||
    loc.pathname.startsWith("/checkout") ||
    loc.pathname.startsWith("/admin") ||
    loc.pathname.startsWith("/seller") ||
    loc.pathname.startsWith("/login") ||
    loc.pathname.startsWith("/register");

  if (hidden || items.length === 0 || !scrolled) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-0 inset-x-0 z-50 px-3 pb-3 lg:px-0 lg:pb-0 pointer-events-none animate-slide-in-bottom">
      <div className="mx-auto max-w-3xl lg:max-w-none lg:rounded-none rounded-2xl pointer-events-auto bg-card/95 backdrop-blur-xl border border-border lg:border-x-0 lg:border-b-0 shadow-2xl">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shrink-0">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 grid h-5 min-w-5 px-1 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {count}
              </span>
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{count} আইটেম</div>
              <div className="font-display font-bold text-base text-gradient-brand truncate">{formatBDT(subtotal)}</div>
            </div>
          </div>
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-105 transition whitespace-nowrap"
          >
            চেকআউট <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
