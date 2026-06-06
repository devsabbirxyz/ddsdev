import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, ShoppingCart, Store } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ComponentType } from "react";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.13-.63.044-1.003-.115-.3-2.064-1.69-2.464-1.69zm-2.64 5.704h-.014a8.527 8.527 0 0 1-4.34-1.184l-.314-.187-3.222.845.86-3.137-.2-.33a8.566 8.566 0 0 1-1.302-4.554c.014-4.726 3.854-8.567 8.581-8.567a8.51 8.51 0 0 1 6.066 2.508 8.55 8.55 0 0 1 2.494 6.066c0 4.726-3.84 8.539-8.61 8.539zm7.297-15.864A10.247 10.247 0 0 0 16.47 4c-5.685 0-10.31 4.625-10.323 10.31 0 1.816.473 3.59 1.376 5.154L6 25l5.71-1.49a10.314 10.314 0 0 0 4.926 1.246h.014c5.685 0 10.31-4.626 10.32-10.31a10.25 10.25 0 0 0-3.21-7.4z" />
  </svg>
);
import { useCart } from "@/lib/cart";
import { siteSettingsQuery } from "@/lib/site-settings";

type NavItem = {
  search?: Record<string, unknown>;
  key: string;
  label: string;
  to?: string;
  href?: string;
  external?: boolean;
  match?: (path: string) => boolean;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

export function MobileBottomNav() {
  const { count } = useCart();
  const { data: s } = useQuery(siteSettingsQuery);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (st) => st.location.pathname });

  const wa = (s?.whatsapp_number || "").replace(/[^0-9]/g, "");
  const waHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent("আসসালামু আলাইকুম, আমি একটা প্রোডাক্ট সম্পর্কে জানতে চাই।")}`
    : "#";

  const search = useRouterState({ select: (st) => st.location.search as Record<string, unknown> });
  const isSearchFocus = (search as any)?.focus === "search";

  const items: NavItem[] = [
    { key: "home", label: "হোম", to: "/", Icon: Home, match: (p) => p === "/" },
    { key: "search", label: "সার্চ", to: "/shop", search: { focus: "search" }, Icon: Search, match: (p) => p.startsWith("/shop") && isSearchFocus },
    { key: "cart", label: "কার্ট", to: "/cart", Icon: ShoppingCart, match: (p) => p.startsWith("/cart"), badge: count },
    { key: "shop", label: "শপ", to: "/shop", Icon: Store, match: (p) => p.startsWith("/shop") && !isSearchFocus },
    { key: "wa", label: "WhatsApp", href: waHref, external: true, Icon: WhatsAppIcon },
  ];

  const routeIndex = items.findIndex((it) => it.match?.(pathname));
  const [activeIdx, setActiveIdx] = useState(routeIndex >= 0 ? routeIndex : 0);
  const activeKey = items[activeIdx]?.key;

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const nextIndex = routeIndex >= 0 ? routeIndex : 0;

    // Search shares /shop with Shop. After focusing search, the shop page clears
    // the temporary URL flag, so keep the clicked Search item active until the
    // user explicitly taps Shop or another destination.
    if (pathname.startsWith("/shop") && activeKey === "search" && !isSearchFocus) return;

    setActiveIdx((current) => (current === nextIndex ? current : nextIndex));
  }, [pathname, routeIndex, isSearchFocus, activeKey]);

  const handleNavClick = (index: number, item: NavItem) => {
    setActiveIdx(index);
    navigate({ to: item.to as any, search: (item.search as any) ?? {} });
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width);
    });
    ro.observe(containerRef.current);
    setWidth(containerRef.current.offsetWidth);
    return () => ro.disconnect();
  }, []);

  const N = items.length;
  const slotW = width / N;
  const cx = slotW * (activeIdx + 0.5);
  const barH = 64;
  const dipR = 34; // dip radius
  const dipDepth = 22;

  // Build SVG path for bar with curved dip centered at cx
  const path = (() => {
    const w = width || 100;
    const h = barH;
    const r = 24; // corner radius
    const dipHalf = dipR + 6;
    const left = cx - dipHalf;
    const right = cx + dipHalf;
    return [
      `M ${r} 0`,
      `L ${left} 0`,
      // dip: cubic to center bottom of arc, then back up
      `C ${left + 10} 0, ${cx - dipR} ${dipDepth}, ${cx} ${dipDepth}`,
      `C ${cx + dipR} ${dipDepth}, ${right - 10} 0, ${right} 0`,
      `L ${w - r} 0`,
      `Q ${w} 0 ${w} ${r}`,
      `L ${w} ${h - r}`,
      `Q ${w} ${h} ${w - r} ${h}`,
      `L ${r} ${h}`,
      `Q 0 ${h} 0 ${h - r}`,
      `L 0 ${r}`,
      `Q 0 0 ${r} 0 Z`,
    ].join(" ");
  })();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pointer-events-none"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
    >
      <div
        ref={containerRef}
        className="relative pointer-events-auto"
        style={{
          height: barH,
          filter: "drop-shadow(0 -4px 30px rgba(123,47,190,0.25))",
        }}
      >
        {/* SVG bar with curved dip */}
        <svg
          width="100%"
          height={barH}
          viewBox={`0 0 ${width || 100} ${barH}`}
          preserveAspectRatio="none"
          className="absolute inset-0 block"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient id="bn-stroke" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
          </defs>
          <path
            d={path}
            fill="rgba(13,13,26,0.85)"
            stroke="url(#bn-stroke)"
            strokeWidth="1"
            style={{ transition: "d 300ms cubic-bezier(0.4,0,0.2,1)" }}
          />
        </svg>

        {/* Floating active circle — persistent element, animates via transform */}
        <div
          className="absolute top-0 left-0 z-10 pointer-events-none"
          style={{
            width: 52,
            height: 52,
            transform: `translate3d(${cx - 26}px, -22px, 0)`,
            transition: width > 0 ? "transform 300ms cubic-bezier(0.4,0,0.2,1)" : "none",
            willChange: "transform",
            visibility: width > 0 ? "visible" : "hidden",
          }}
        >
          <div
            className="grid place-items-center h-[52px] w-[52px] rounded-full text-white"
            style={{
              background: "linear-gradient(135deg, #FF6B35, #7B2FBE)",
              boxShadow: "0 8px 24px rgba(255,107,53,0.45), 0 0 0 4px rgba(13,13,26,0.85)",
            }}
          >
            <div
              key={activeIdx}
              className="animate-[bn-pop_400ms_cubic-bezier(0.4,0,0.2,1)] grid place-items-center"
            >
              {(() => {
                const Active = items[activeIdx].Icon;
                return <Active className="h-6 w-6" />;
              })()}
            </div>
          </div>
        </div>

        {/* Items row */}
        <div className="absolute inset-0 flex items-center">
          {items.map((it, i) => {
            const active = i === activeIdx;
            const content = (
              <div className="relative flex flex-col items-center justify-center w-full h-full">
                {!active && (
                  <it.Icon
                    className={`h-5 w-5 ${it.key === "wa" ? "text-emerald-400" : ""}`}
                    {...({ style: it.key !== "wa" ? { color: "rgba(255,255,255,0.45)" } : undefined } as any)}
                  />
                )}
                {it.key === "cart" && it.badge && it.badge > 0 ? (
                  <span
                    className="absolute top-2 right-1/2 translate-x-[14px] grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold text-white"
                    style={{ background: "#FF6B35", boxShadow: "0 0 10px rgba(255,107,53,0.6)" }}
                  >
                    {it.badge}
                  </span>
                ) : null}
              </div>
            );
            const cls = "flex-1 h-full flex items-center justify-center border-0 bg-transparent p-0";
            if (it.external) {
              return (
                <a key={it.key} href={it.href} target="_blank" rel="noopener noreferrer" className={cls} aria-label={it.label}>
                  {content}
                </a>
              );
            }
            return (
              <button key={it.key} type="button" onClick={() => handleNavClick(i, it)} className={cls} aria-label={it.label}>
                {content}
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes bn-pop {
          0% { transform: scale(0.8); }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </nav>
  );
}
