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

  const cls = (active: boolean) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition ${
      active ? "text-primary" : "text-foreground/60"
    }`;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-glass-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch">
        <Link to="/" className={cls(isActive("/"))}>
          <Home className="h-5 w-5" />
          <span>হোম</span>
        </Link>
        <Link to="/shop" search={{ q: "" } as any} className={cls(pathname === "/shop" && false)}>
          <Search className="h-5 w-5" />
          <span>সার্চ</span>
        </Link>
        <Link to="/cart" className={cls(isActive("/cart"))}>
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </div>
          <span>কার্ট</span>
        </Link>
        <Link to="/shop" className={cls(isActive("/shop"))}>
          <Store className="h-5 w-5" />
          <span>শপ</span>
        </Link>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${cls(false)} text-emerald-500`}
          aria-label="WhatsApp"
        >
          <MessageCircle className="h-5 w-5 fill-emerald-500/20" />
          <span>WhatsApp</span>
        </a>
      </div>
    </nav>
  );
}
