import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, ShoppingCart, Store } from "lucide-react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.13-.63.044-1.003-.115-.3-2.064-1.69-2.464-1.69zm-2.64 5.704h-.014a8.527 8.527 0 0 1-4.34-1.184l-.314-.187-3.222.845.86-3.137-.2-.33a8.566 8.566 0 0 1-1.302-4.554c.014-4.726 3.854-8.567 8.581-8.567a8.51 8.51 0 0 1 6.066 2.508 8.55 8.55 0 0 1 2.494 6.066c0 4.726-3.84 8.539-8.61 8.539zm7.297-15.864A10.247 10.247 0 0 0 16.47 4c-5.685 0-10.31 4.625-10.323 10.31 0 1.816.473 3.59 1.376 5.154L6 25l5.71-1.49a10.314 10.314 0 0 0 4.926 1.246h.014c5.685 0 10.31-4.626 10.32-10.31a10.25 10.25 0 0 0-3.21-7.4z"/>
  </svg>
);
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
            <WhatsAppIcon className="h-5 w-5 text-emerald-400" />
          </IconTile>
          <span>WhatsApp</span>
        </a>
      </div>
    </nav>
  );
}
