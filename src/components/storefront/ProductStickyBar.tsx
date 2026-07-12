import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
import { formatBDT } from "@/lib/storefront";

export function ProductStickyBar({
  title,
  image,
  price,
  regularPrice,
  disabled,
  disabledLabel,
  onAdd,
  ctaLabel = "কার্টে যোগ",
}: {
  title: string;
  image?: string | null;
  price: number;
  regularPrice?: number | null;
  disabled?: boolean;
  disabledLabel?: string;
  onAdd: () => void;
  ctaLabel?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  const hasDiscount = regularPrice != null && regularPrice > price;

  return (
    <div className="lg:hidden fixed bottom-16 inset-x-0 z-40 px-3 pb-2 pointer-events-none animate-slide-in-bottom">
      <div className="mx-auto max-w-3xl rounded-2xl pointer-events-auto bg-card/95 backdrop-blur-xl border border-border shadow-2xl">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-11 w-11 rounded-xl overflow-hidden bg-muted grid place-items-center shrink-0">
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-bold">{title.slice(0, 2)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold truncate">{title}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-gradient-brand">{formatBDT(price)}</span>
              {hasDiscount && (
                <span className="text-[10px] text-muted-foreground line-through">{formatBDT(regularPrice!)}</span>
              )}
            </div>
          </div>
          <button
            onClick={onAdd}
            disabled={disabled}
            className="rounded-xl bg-gradient-brand px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-glow inline-flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {disabled ? disabledLabel ?? "স্টকে নেই" : ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
