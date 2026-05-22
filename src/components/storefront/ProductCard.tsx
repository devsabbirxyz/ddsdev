import { Link } from "@tanstack/react-router";
import { Star, Zap } from "lucide-react";
import { formatBDT } from "@/lib/storefront";

export interface ProductCardData {
  id: string;
  slug: string;
  title: string;
  title_en?: string | null;
  short_description?: string | null;
  regular_price?: number | null;
  offer_price?: number | null;
  average_rating?: number | null;
  total_reviews?: number | null;
  is_featured?: boolean | null;
  is_new_arrival?: boolean | null;
  is_best_seller?: boolean | null;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const price = p.offer_price ?? p.regular_price;
  const hasDiscount = p.offer_price != null && p.regular_price != null && p.offer_price < p.regular_price;
  const off = hasDiscount
    ? Math.round((1 - Number(p.offer_price) / Number(p.regular_price)) * 100)
    : 0;

  return (
    <Link
      to="/product/$slug"
      params={{ slug: p.slug }}
      className="group glass-card rounded-2xl overflow-hidden hover:shadow-glow transition-all hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] bg-gradient-glow grid place-items-center overflow-hidden">
        <div className="text-5xl font-display font-bold text-gradient-brand opacity-30 select-none">
          {p.title.slice(0, 2).toUpperCase()}
        </div>
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {p.is_new_arrival && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">NEW</span>
          )}
          {p.is_best_seller && (
            <span className="rounded-full bg-gradient-brand px-2 py-0.5 text-[10px] font-bold text-primary-foreground">BEST</span>
          )}
        </div>
        {hasDiscount && (
          <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            -{off}%
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.title}</h3>
        {p.short_description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.short_description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-lg text-gradient-brand">{formatBDT(price)}</span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">{formatBDT(p.regular_price)}</span>
            )}
          </div>
          {p.average_rating ? (
            <span className="inline-flex items-center gap-1 text-xs">
              <Star className="h-3 w-3 fill-primary text-primary" />
              <span className="font-semibold">{Number(p.average_rating).toFixed(1)}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3 text-primary" />
              অটো
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="glass-card rounded-3xl p-10 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow mb-3">
        <Zap className="h-7 w-7 text-primary-foreground" />
      </div>
      <h3 className="font-display font-bold text-xl">{title}</h3>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
