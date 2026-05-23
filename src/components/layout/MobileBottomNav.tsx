import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, ShoppingCart, Store, MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { siteSettingsQuery } from "@/lib/site-settings";

export function MobileBottomNav() {
  const { count } = useCart();
  const { data: s } = useQuery(siteSettingsQuery);
  const pathname = useRouterState({ select: (st) => st.location.pathname });

  const wa = (s?.whatsapp_number || "").replace(/[^0-9]/g, "");
  const waHref = wa ? `https://wa.me/${wa}?text=${encodeURIComponent("আসসালামু আলাইকুম, আমি একটা প্রোডাক্ট সম্পর্কে জানতে চাই।")}` : "#";

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  const itemCls = "flex-1 flex flex-col items-center justify-center gap-1 py-1.5 text-[10px] font-medium transition";

  const IconTile = ({
    active,
    children,
    accent = "primary",
  }: {
    active: boolean;
    children: React.ReactNode;
    accent?: "primary" | "emerald";
  }) => {
    const ring =
      accent === "emerald"
        ? "border-emerald-400/50 shadow-[0_0_18px_-2px_rgba(16,185,129,0.55),inset_0_0_10px_rgba(16,185,129,0.18)]"
        : active
          ? "border-primary/70 shadow-[0_0_22px_-2px_color-mix(in_oklab,var(--primary)_70%,transparent),inset_0_0_12px_color-mix(in_oklab,var(--primary)_25%,transparent)]"
          : "border-white/15 shadow-[0_0_14px_-4px_color-mix(in_oklab,var(--primary)_45%,transparent),inset_0_0_8px_rgba(255,255,255,0.06)]";
    return (
      <div
        className={`relative grid h-10 w-10 place-items-center rounded-2xl border bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md ${ring} transition`}
      >
        {children}
      </div>
    );
  };

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-glass-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        <Link to="/" className={`${itemCls} ${isActive("/") ? "text-primary" : "text-foreground/70"}`}>
          <IconTile active={isActive("/")}>
            <Home className="h-5 w-5" />
          </IconTile>
          <span>হোম</span>
        </Link>
        <Link to="/shop" className={`${itemCls} ${pathname === "/shop" ? "text-primary" : "text-foreground/70"}`}>
          <IconTile active={false}>
            <Search className="h-5 w-5" />
          </IconTile>
          <span>সার্চ</span>
        </Link>
        <Link to="/cart" className={`${itemCls} ${isActive("/cart") ? "text-primary" : "text-foreground/70"}`}>
          <IconTile active={isActive("/cart")}>
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-glow">
                {count}
              </span>
            )}
          </IconTile>
          <span>কার্ট</span>
        </Link>
        <Link to="/shop" className={`${itemCls} ${isActive("/shop") ? "text-primary" : "text-foreground/70"}`}>
          <IconTile active={isActive("/shop")}>
            <Store className="h-5 w-5" />
          </IconTile>
          <span>শপ</span>
        </Link>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${itemCls} text-emerald-400`}
          aria-label="WhatsApp"
        >
          <IconTile active={false} accent="emerald">
            <MessageCircle className="h-5 w-5 fill-emerald-500/20" />
          </IconTile>
          <span>WhatsApp</span>
        </a>
      </div>
    </nav>
  );
}
