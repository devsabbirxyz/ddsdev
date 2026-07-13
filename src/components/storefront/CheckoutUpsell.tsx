import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Sparkles, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/storefront";

type UpsellProduct = {
  id: string;
  slug: string;
  title: string;
  regular_price: number | null;
  offer_price: number | null;
  category_id: string | null;
  is_variant: boolean;
  product_images: { image_url: string; is_main: boolean | null; sort_order: number | null }[] | null;
};

export function CheckoutUpsell({ cartProductIds }: { cartProductIds: string[] }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState<Record<string, boolean>>({});

  // Fetch categories of cart items
  const { data: cartCats = [] } = useQuery({
    queryKey: ["upsell-cart-cats", cartProductIds],
    enabled: cartProductIds.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("category_id")
        .in("id", cartProductIds);
      if (error) throw error;
      return Array.from(new Set((data ?? []).map((r: any) => r.category_id).filter(Boolean))) as string[];
    },
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["checkout-upsell", cartProductIds, cartCats],
    enabled: cartProductIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const excludeIds = cartProductIds;
      const results: UpsellProduct[] = [];
      const seen = new Set<string>(excludeIds);

      const baseSelect =
        "id,slug,title,regular_price,offer_price,category_id,is_variant,product_images(image_url,is_main,sort_order)";

      // 1) Same-category top sellers
      if (cartCats.length > 0) {
        const q = supabase
          .from("products")
          .select(baseSelect)
          .eq("is_active", true)
          .eq("status", "approved")
          .in("category_id", cartCats)
          .order("total_sales", { ascending: false })
          .limit(8);
        const { data } = await q;
        for (const r of (data ?? []) as UpsellProduct[]) {
          if (!seen.has(r.id)) {
            results.push(r);
            seen.add(r.id);
            if (results.length >= 4) break;
          }
        }
      }

      // 2) Fallback: best sellers overall
      if (results.length < 4) {
        const { data } = await supabase
          .from("products")
          .select(baseSelect)
          .eq("is_active", true)
          .eq("status", "approved")
          .order("total_sales", { ascending: false })
          .limit(8 + excludeIds.length);
        for (const r of (data ?? []) as UpsellProduct[]) {
          if (!seen.has(r.id)) {
            results.push(r);
            seen.add(r.id);
            if (results.length >= 4) break;
          }
        }
      }

      return results.slice(0, 4);
    },
  });

  const cartLineKey = useMemo(
    () => new Set(items.map((i) => `${i.productId}::${i.variantId ?? ""}`)),
    [items],
  );

  if (!suggestions || suggestions.length === 0) return null;

  const handleAdd = (p: UpsellProduct) => {
    if (p.is_variant) {
      // Variant products need selection — link out instead
      toast.info("ভেরিয়েন্ট সিলেক্ট করতে প্রোডাক্ট পেজে যান");
      return;
    }
    const price = Number(p.offer_price ?? p.regular_price ?? 0);
    if (!price) {
      toast.error("প্রাইস পাওয়া যায়নি");
      return;
    }
    const images = (p.product_images ?? []).slice().sort((a, b) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
    const image = images[0]?.image_url ?? null;
    addItem({
      productId: p.id,
      slug: p.slug,
      title: p.title,
      price,
      image,
      quantity: 1,
    });
    setAdded((s) => ({ ...s, [p.id]: true }));
    toast.success("কার্টে যোগ হয়েছে");
    setTimeout(() => setAdded((s) => ({ ...s, [p.id]: false })), 1600);
  };

  return (
    <section className="glass-card rounded-2xl p-5">
      <h2 className="font-display font-bold text-lg mb-4 inline-flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" /> আপনি এটাও কিনতে পারেন
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {suggestions.map((p) => {
          const images = (p.product_images ?? []).slice().sort((a, b) => {
            if (a.is_main && !b.is_main) return -1;
            if (!a.is_main && b.is_main) return 1;
            return (a.sort_order ?? 0) - (b.sort_order ?? 0);
          });
          const img = images[0]?.image_url ?? null;
          const offer = p.offer_price != null ? Number(p.offer_price) : null;
          const regular = p.regular_price != null ? Number(p.regular_price) : null;
          const showRegular = offer != null && regular != null && regular > offer;
          const price = offer ?? regular ?? 0;
          const discountPct = showRegular ? Math.round(((regular! - offer!) / regular!) * 100) : 0;
          const inCart = cartLineKey.has(`${p.id}::`);
          const justAdded = added[p.id];

          return (
            <div
              key={p.id}
              className="group relative flex flex-col rounded-xl glass border border-border/60 overflow-hidden hover:border-primary/40 hover:shadow-glow transition"
            >
              <Link to="/product/$slug" params={{ slug: p.slug }} className="block relative aspect-square overflow-hidden">
                {img ? (
                  <img src={img} alt={p.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="h-full w-full grid place-items-center bg-gradient-to-br from-primary/10 to-secondary/10">
                    <span className="font-display font-bold text-2xl text-gradient-brand">{p.title.slice(0, 2)}</span>
                  </div>
                )}
                {discountPct > 0 && (
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-destructive/90 backdrop-blur px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
                    −{discountPct}%
                  </span>
                )}
              </Link>
              <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                <Link to="/product/$slug" params={{ slug: p.slug }} className="text-xs font-semibold line-clamp-2 hover:text-primary transition">
                  {p.title}
                </Link>
                <div className="flex items-baseline gap-1.5 mt-auto">
                  <span className="font-display font-bold text-sm text-gradient-brand">{formatBDT(price)}</span>
                  {showRegular && (
                    <span className="text-[10px] text-muted-foreground line-through">{formatBDT(regular!)}</span>
                  )}
                </div>
                <button
                  onClick={() => handleAdd(p)}
                  disabled={justAdded || inCart}
                  className={`mt-1 inline-flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-bold transition ${
                    justAdded || inCart
                      ? "bg-primary/20 text-primary"
                      : "bg-gradient-brand text-primary-foreground shadow-glow hover:scale-[1.02]"
                  }`}
                >
                  {justAdded || inCart ? (
                    <>
                      <Check className="h-3 w-3" /> যোগ হয়েছে
                    </>
                  ) : p.is_variant ? (
                    <>দেখুন</>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" /> Add
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
