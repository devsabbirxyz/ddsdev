import { Link } from "@tanstack/react-router";
import { Eye, Layers, ArrowUpRight, Zap } from "lucide-react";
import { formatBDT } from "@/lib/storefront";
import { SmartImage } from "./SmartImage";

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
  is_variant?: boolean | null;
  view_count?: number | null;
  sellers?: { store_name?: string | null; store_logo_url?: string | null } | null;
  product_images?: Array<{ image_url: string; is_main?: boolean | null; sort_order?: number | null }> | null;
  product_variants?: Array<{ regular_price?: number | null; offer_price?: number | null; is_active?: boolean | null }> | null;
}

export function ProductCard({ p }: { p: ProductCardData }) {
  const price = p.offer_price ?? p.regular_price;
  const hasDiscount = p.offer_price != null && p.regular_price != null && p.offer_price < p.regular_price;

  const activeVariants = (p.product_variants ?? []).filter((v) => v.is_active);
  const isVariant = !!p.is_variant && activeVariants.length > 0;
  const variantPrices = activeVariants
    .map((v) => Number(v.offer_price ?? v.regular_price ?? 0))
    .filter((n) => n > 0);
  const variantMin = variantPrices.length ? Math.min(...variantPrices) : null;
  const variantMax = variantPrices.length ? Math.max(...variantPrices) : null;

  const sellerName = p.sellers?.store_name ?? null;
  const sellerLogo = p.sellers?.store_logo_url ?? null;
  const initials = (sellerName ?? p.title).slice(0, 2).toUpperCase();
  const views = p.view_count ?? 0;

  const images = (p.product_images ?? []).slice().sort((a, b) => {
    if ((b.is_main ? 1 : 0) !== (a.is_main ? 1 : 0)) return (b.is_main ? 1 : 0) - (a.is_main ? 1 : 0);
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const mainImage = images[0]?.image_url ?? null;

  return (
    <Link
      to="/product/$slug"
      params={{ slug: p.slug }}
      className="group relative block overflow-hidden rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-xl shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.3)] transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_20px_50px_-12px_hsl(var(--primary)/0.55)]"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <SmartImage
          src={mainImage}
          alt={p.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />


        {/* top-left badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {p.is_best_seller && (
            <span
              className="rounded-lg px-2.5 py-1 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(255,107,53,0.6)]"
              style={{ background: "linear-gradient(135deg,#FF6B35,#7B2FBE)" }}
            >
              🏆 Best Seller
            </span>
          )}
          {isVariant && (
            <span className="inline-flex items-center gap-1 rounded-full bg-background/70 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-foreground border border-primary/30">
              <Layers className="h-3 w-3" /> Variants
            </span>
          )}
        </div>

        {/* discount badge */}
        {hasDiscount && !isVariant && (
          <span className="absolute bottom-3 left-3 rounded-full bg-destructive px-2.5 py-1 text-[10px] font-bold text-destructive-foreground shadow">
            -{Math.round((1 - Number(p.offer_price) / Number(p.regular_price)) * 100)}%
          </span>
        )}

        {/* views */}
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-background/60 backdrop-blur px-2 py-1 text-[10px] font-semibold text-foreground/80 border border-border/50">
          <Eye className="h-3 w-3" /> {views}
        </span>

        {/* seller avatar top-right */}
        <div className="absolute top-3 right-3 h-9 w-9 rounded-full overflow-hidden border-2 border-background/80 shadow-lg bg-gradient-brand grid place-items-center text-[10px] font-bold text-primary-foreground">
          {sellerLogo ? (
            <img src={sellerLogo} alt={sellerName ?? "seller"} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-display font-bold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {p.title}
        </h3>
        {sellerName && (
          <p className="mt-0.5 text-xs text-muted-foreground/80">by {sellerName}</p>
        )}
        {p.short_description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {p.short_description}
          </p>
        )}

        {/* Price + CTA */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="rounded-full bg-background/60 backdrop-blur border border-border/60 px-3 py-1.5">
            {isVariant && variantMin != null && variantMax != null && variantMin !== variantMax ? (
              <span className="font-display font-bold text-sm text-gradient-brand">
                {formatBDT(variantMin)} - {formatBDT(variantMax)}
              </span>
            ) : (
              <span className="flex items-baseline gap-1.5">
                <span className="font-display font-bold text-base text-gradient-brand">{formatBDT(price)}</span>
                {hasDiscount && (
                  <span className="text-[10px] text-muted-foreground line-through">{formatBDT(p.regular_price)}</span>
                )}
              </span>
            )}
          </div>

          <span className="relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold text-white shadow-glow bg-[linear-gradient(135deg,#ff7a18,#8b5cf6)] bg-[length:200%_200%] bg-left transition-[background-position,transform] duration-500 group-hover:bg-right group-hover:scale-105">
            Shop Now
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* hover glow ring */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-primary/0 group-hover:ring-primary/30 transition" />
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
