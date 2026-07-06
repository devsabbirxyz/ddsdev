import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, ShoppingCart, Store } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type ComponentType } from "react";

import { useCart } from "@/lib/cart";
import { siteSettingsQuery } from "@/lib/site-settings";

type IconProps = { className?: string; style?: CSSProperties };

const WhatsAppIcon = ({ className, style }: IconProps) => (
  <svg
    viewBox="0 0 32 32"
    className={className}
    style={style}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.13-.63.044-1.003-.115-.3-2.064-1.69-2.464-1.69zm-2.64 5.704h-.014a8.527 8.527 0 0 1-4.34-1.184l-.314-.187-3.222.845.86-3.137-.2-.33a8.566 8.566 0 0 1-1.302-4.554c.014-4.726 3.854-8.567 8.581-8.567a8.51 8.51 0 0 1 6.066 2.508 8.55 8.55 0 0 1 2.494 6.066c0 4.726-3.84 8.539-8.61 8.539zm7.297-15.864A10.247 10.247 0 0 0 16.47 4c-5.685 0-10.31 4.625-10.323 10.31 0 1.816.473 3.59 1.376 5.154L6 25l5.71-1.49a10.314 10.314 0 0 0 4.926 1.246h.014c5.685 0 10.31-4.626 10.32-10.31a10.25 10.25 0 0 0-3.21-7.4z" />
  </svg>
);

type NavItem = {
  search?: Record<string, unknown>;
  key: "home" | "search" | "cart" | "shop" | "wa";
  label: string;
  to?: "/" | "/shop" | "/cart";
  href?: string;
  external?: boolean;
  match?: (path: string) => boolean;
  Icon: ComponentType<IconProps>;
  badge?: number;
};

function getRouteIndex(pathname: string, isSearchFocus: boolean) {
  if (pathname === "/") return 0;
  if (pathname.startsWith("/shop") && isSearchFocus) return 1;
  if (pathname.startsWith("/cart")) return 2;
  if (pathname.startsWith("/shop")) return 3;
  return 0;
}

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
  const isSearchFocus = search.focus === "search";

  const items: NavItem[] = [
    { key: "home", label: "হোম", to: "/", Icon: Home, match: (p) => p === "/" },
    {
      key: "search",
      label: "সার্চ",
      to: "/shop",
      search: { focus: "search" },
      Icon: Search,
      match: (p) => p.startsWith("/shop") && isSearchFocus,
    },
    {
      key: "cart",
      label: "কার্ট",
      to: "/cart",
      Icon: ShoppingCart,
      match: (p) => p.startsWith("/cart"),
      badge: count,
    },
    {
      key: "shop",
      label: "শপ",
      to: "/shop",
      Icon: Store,
      match: (p) => p.startsWith("/shop") && !isSearchFocus,
    },
    { key: "wa", label: "WhatsApp", href: waHref, external: true, Icon: WhatsAppIcon },
  ];

  const [activeIdx, setActiveIdx] = useState(() =>
    getRouteIndex(pathname, isSearchFocus)
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [navReady, setNavReady] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastClickTimeRef = useRef(0);
  const activeIdxRef = useRef(activeIdx);
  const initTimerRef = useRef<number | null>(null);

  // Keep ref in sync with state so route-sync effect always sees latest value
  useEffect(() => {
    activeIdxRef.current = activeIdx;
  }, [activeIdx]);

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const nextWidth = e.contentRect.width;
        if (nextWidth > 0) {
          setWidth(nextWidth);
          if (initTimerRef.current === null) {
            initTimerRef.current = window.setTimeout(() => setNavReady(true), 160);
          }
        }
      }
    });
    ro.observe(containerRef.current);
    const initialWidth = containerRef.current.offsetWidth;
    if (initialWidth > 0) {
      setWidth(initialWidth);
      if (initTimerRef.current === null) {
        initTimerRef.current = window.setTimeout(() => setNavReady(true), 160);
      }
    }
    return () => {
      ro.disconnect();
      if (initTimerRef.current !== null) window.clearTimeout(initTimerRef.current);
    };
  }, []);

  // Pinterest-style hide on scroll down, show on scroll up
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const THRESHOLD = 8;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - lastY;
        if (y < 80) {
          setHidden(false);
        } else if (dy > THRESHOLD) {
          setHidden(true);
          lastY = y;
        } else if (dy < -THRESHOLD) {
          setHidden(false);
          lastY = y;
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Clamp cx so the dip curve stays inside the bar's rounded corners
  const CORNER_R = 24;
  const DIP_HALF = 40; // dipR (34) + 6 padding, matches path()
  const clampCx = (raw: number) => {
    if (width <= 0) return raw;
    const min = CORNER_R + DIP_HALF;
    const max = width - CORNER_R - DIP_HALF;
    if (min >= max) return width / 2;
    return Math.max(min, Math.min(max, raw));
  };

  // Animate circle from one tab index to another using direct DOM reflow
  const animateCircle = (fromIdx: number, toIdx: number) => {
    const el = circleRef.current;
    if (!el || width <= 0 || fromIdx === toIdx) return;

    const slotW = width / items.length;
    const fromCx = clampCx(slotW * (fromIdx + 0.5));
    const toCx = clampCx(slotW * (toIdx + 0.5));

    // 1. Disable transition and snap to old position
    el.style.transition = "none";
    el.style.transform = `translate3d(${fromCx - 26}px, -22px, 0)`;

    // 2. Force reflow so browser registers the old position
    void el.offsetHeight;

    // 3. Enable transition and set new position
    el.style.transition = "transform 300ms cubic-bezier(0.4,0,0.2,1)";
    el.style.transform = `translate3d(${toCx - 26}px, -22px, 0)`;
  };

  const handleNavClick = (index: number, item: NavItem) => {
    if (!item.to || index === activeIdx) return;

    lastClickTimeRef.current = Date.now();
    animateCircle(activeIdx, index);
    setActiveIdx(index);
    navigate({ to: item.to, search: item.search ?? {} });
  };

  // Route sync: back-button / direct URL / search-focus clear
  useEffect(() => {
    const nextIndex = getRouteIndex(pathname, isSearchFocus);
    const currentIdx = activeIdxRef.current;
    if (nextIndex === currentIdx) return;

    // Skip sync if we just clicked (prevents overriding the click-driven animation)
    if (Date.now() - lastClickTimeRef.current < 400) return;

    animateCircle(currentIdx, nextIndex);
    setActiveIdx(nextIndex);
  }, [pathname, isSearchFocus]);

  const N = items.length;
  const slotW = width / N;
  const cx = slotW * (activeIdx + 0.5);
  const barH = 64;
  const dipR = 34;
  const dipDepth = 22;

  // Build SVG path for bar with curved dip centered at cx
  const path = (() => {
    const w = width || 100;
    const h = barH;
    const r = 24;
    const dipHalf = dipR + 6;
    const left = cx - dipHalf;
    const right = cx + dipHalf;
    return [
      `M ${r} 0`,
      `L ${left} 0`,
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
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
        transform: hidden ? "translateY(calc(100% + 24px))" : "translateY(0)",
        transition: "transform 300ms cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <div
        ref={containerRef}
        className="relative pointer-events-auto"
        style={{
          height: barH,
          filter: "drop-shadow(0 -4px 30px rgba(79,70,229,0.35))",
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
            fill="rgba(10,10,26,0.92)"
            stroke="url(#bn-stroke)"
            strokeWidth="1"
            style={{ transition: navReady ? "d 300ms cubic-bezier(0.4,0,0.2,1)" : "none" }}
          />
        </svg>

        {/* Floating active circle — persistent element, animates via direct DOM manipulation */}
        <div
          ref={circleRef}
          className="absolute top-0 left-0 z-10 pointer-events-none"
          style={{
            width: 52,
            height: 52,
            transform: `translate3d(${cx - 26}px, -22px, 0)`,
            transition: navReady ? "transform 300ms cubic-bezier(0.4,0,0.2,1)" : "none",
            willChange: "transform",
            visibility: width > 0 ? "visible" : "hidden",
          }}
        >
          <div
            className="grid place-items-center h-[52px] w-[52px] rounded-full text-white"
            style={{
              background: "linear-gradient(135deg, #4f46e5, #1e1e5a)",
              boxShadow: "0 8px 24px rgba(79,70,229,0.55), 0 0 0 4px rgba(10,10,26,0.92)",
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
                    style={
                      it.key !== "wa"
                        ? ({ color: "rgba(255,255,255,0.45)" } as CSSProperties)
                        : undefined
                    }
                  />
                )}
                {it.key === "cart" && it.badge && it.badge > 0 ? (
                  <span
                    className="absolute top-2 right-1/2 translate-x-[14px] grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold text-white"
                    style={{
                      background: "#4f46e5",
                      boxShadow: "0 0 10px rgba(79,70,229,0.7)",
                    }}
                  >
                    {it.badge}
                  </span>
                ) : null}
              </div>
            );
            const cls =
              "flex-1 h-full flex items-center justify-center border-0 bg-transparent p-0";
            if (it.external) {
              return (
                <a
                  key={it.key}
                  href={it.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cls}
                  aria-label={it.label}
                >
                  {content}
                </a>
              );
            }
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => handleNavClick(i, it)}
                className={cls}
                aria-label={it.label}
              >
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
