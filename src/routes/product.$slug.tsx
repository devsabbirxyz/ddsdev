import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Star, Zap, ShieldCheck, Headphones, Heart, ShoppingCart, Eye } from "lucide-react";
import { productBySlugQuery, productReviewsQuery, productsQuery, formatBDT } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductViewTracker } from "@/components/storefront/ProductViewTracker";
import { RecentlyViewed } from "@/components/storefront/RecentlyViewed";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productBySlugQuery(params.slug));
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    const title = p ? `${p.title} — DDS-Digital` : "প্রোডাক্ট — DDS-Digital";
    const desc = p?.short_description || "DDS-Digital থেকে কিনুন — ইনস্ট্যান্ট অটো ডেলিভারি।";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
      ],
      links: p ? [{ rel: "canonical", href: `/product/${p.slug}` }] : [],
      scripts: p ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.title,
          description: desc,
          offers: { "@type": "Offer", priceCurrency: "BDT", price: p.offer_price ?? p.regular_price ?? 0 },
        }),
      }] : [],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="grid place-items-center min-h-[60vh] px-4">
      <div className="text-center">
        <h1 className="font-display font-bold text-3xl">প্রোডাক্ট পাওয়া যায়নি</h1>
        <Link to="/shop" className="mt-4 inline-block rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">শপে ফিরে যান</Link>
      </div>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const [variantId, setVariantId] = useState<string | null>(product?.product_variants?.[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const { data: reviews = [] } = useQuery(productReviewsQuery(product?.id));
  const { data: related = [] } = useQuery(productsQuery({ limit: 4 }));
  const { addItem } = useCart();
  const navigate = useNavigate();

  if (!product) return null;
  const images = (product.product_images ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const variants = (product.product_variants ?? []).filter((v: any) => v.is_active);
  const selectedVariant = variants.find((v: any) => v.id === variantId);
  const price = selectedVariant?.offer_price ?? selectedVariant?.regular_price ?? product.offer_price ?? product.regular_price;
  const hasDiscount = product.offer_price != null && product.regular_price != null && product.offer_price < product.regular_price;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <ProductViewTracker productId={product.id} />
      <nav className="text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">হোম</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-foreground">শপ</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square glass-card rounded-3xl grid place-items-center overflow-hidden relative">
            {images[0]?.image_url ? (
              <img src={images[0].image_url} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="text-9xl font-display font-bold text-gradient-brand opacity-20">
                {product.title.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {images.slice(0, 4).map((img: any) => (
                <div key={img.id} className="aspect-square glass-card rounded-xl overflow-hidden">
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {product.is_best_seller && <span className="rounded-full bg-gradient-brand px-3 py-1 text-xs font-bold text-primary-foreground">BEST SELLER</span>}
            {product.is_new_arrival && <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">NEW</span>}
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">{product.title}</h1>

          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="font-semibold">{Number(product.average_rating ?? 0).toFixed(1)}</span>
              <span className="text-muted-foreground">({product.total_reviews ?? 0} রিভিউ)</span>
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{product.total_sales ?? 0} বিক্রি</span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {product.view_count ?? 0} ভিউ
            </span>
          </div>

          {product.short_description && (
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.short_description}</p>
          )}

          <div className="mt-6 glass-card rounded-2xl p-5">
            <div className="flex items-baseline gap-3">
              <span className="font-display font-bold text-4xl text-gradient-brand">{formatBDT(price)}</span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">{formatBDT(product.regular_price)}</span>
              )}
            </div>

            {variants.length > 0 && (
              <div className="mt-5">
                <div className="text-xs font-semibold mb-2">ভ্যারিয়েন্ট নির্বাচন করুন</div>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v: any) => (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${variantId === v.id ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass hover:bg-accent"}`}
                    >
                      {v.label} · {formatBDT(v.offer_price ?? v.regular_price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-3">
              <span className="text-xs font-semibold">পরিমাণ</span>
              <div className="inline-flex items-center rounded-xl glass">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-accent rounded-l-xl" aria-label="কমান">−</button>
                <span className="px-4 py-2 text-sm font-semibold min-w-[2.5rem] text-center">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="px-3 py-2 hover:bg-accent rounded-r-xl" aria-label="বাড়ান">+</button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  addItem({
                    productId: product.id,
                    slug: product.slug,
                    title: product.title,
                    price: Number(price ?? 0),
                    image: images[0]?.image_url ?? null,
                    variantId: selectedVariant?.id ?? null,
                    variantLabel: selectedVariant?.label ?? null,
                    quantity: qty,
                  });
                  navigate({ to: "/checkout" });
                }}
                className="flex-1 min-w-[180px] rounded-2xl bg-gradient-brand px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition inline-flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" /> এখনই কিনুন
              </button>
              <button
                onClick={() => {
                  addItem({
                    productId: product.id,
                    slug: product.slug,
                    title: product.title,
                    price: Number(price ?? 0),
                    image: images[0]?.image_url ?? null,
                    variantId: selectedVariant?.id ?? null,
                    variantLabel: selectedVariant?.label ?? null,
                    quantity: qty,
                  });
                  toast.success("কার্টে যোগ হয়েছে");
                }}
                className="rounded-2xl glass-card px-5 py-3.5 text-sm font-semibold hover:bg-accent transition inline-flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" /> কার্টে যোগ
              </button>
              <button className="rounded-2xl glass-card px-4 py-3.5 hover:bg-accent transition" aria-label="Wishlist">
                <Heart className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "অটো ডেলিভারি" },
              { icon: ShieldCheck, label: "100% নিরাপদ" },
              { icon: Headphones, label: "24/7 সাপোর্ট" },
            ].map((b) => (
              <div key={b.label} className="glass rounded-xl p-3 text-center">
                <b.icon className="h-5 w-5 mx-auto text-primary" />
                <div className="mt-1 text-[11px] font-medium">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Long description */}
      {product.long_description && (
        <section className="mt-12 glass-card rounded-3xl p-6 sm:p-8">
          <h2 className="font-display font-bold text-2xl mb-4">বিস্তারিত বিবরণ</h2>
          <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {product.long_description}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="font-display font-bold text-2xl mb-4">কাস্টমার রিভিউ</h2>
        {reviews.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
            এখনো কোনো রিভিউ নেই। প্রথম রিভিউ আপনি দিন!
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="glass-card rounded-2xl p-5">
                <div className="flex gap-0.5 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <p className="text-sm">{r.review_text}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at!).toLocaleDateString("bn-BD")}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display font-bold text-2xl mb-4">আরো প্রোডাক্ট</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {related.filter((r) => r.id !== product.id).slice(0, 4).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
