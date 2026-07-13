import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Star, Zap, ShieldCheck, Headphones, Heart, ShoppingCart, Eye, MessageCircleQuestion, Send } from "lucide-react";
import { productBySlugQuery, productReviewsQuery, productsQuery, productQuestionsQuery, formatBDT } from "@/lib/storefront";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductViewTracker } from "@/components/storefront/ProductViewTracker";
import { RecentlyViewed } from "@/components/storefront/RecentlyViewed";
import { VariantCompareTable } from "@/components/storefront/VariantCompareTable";
import { BackInStockNotify } from "@/components/storefront/BackInStockNotify";
import { RecentSalesCount } from "@/components/storefront/RecentSalesCount";
import { ProductStickyBar } from "@/components/storefront/ProductStickyBar";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { askQuestion, answerQuestion } from "@/lib/qna.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productBySlugQuery(params.slug));
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const SITE = "https://ddsdev.lovable.app";
    const p: any = loaderData?.product;
    const title = p ? `${p.title} — DDS-Digital` : "প্রোডাক্ট — DDS-Digital";
    const desc = p?.short_description || p?.short_description_en || "DDS-Digital থেকে কিনুন — ইনস্ট্যান্ট অটো ডেলিভারি।";
    const url = p ? `${SITE}/product/${p.slug}` : SITE;
    const images: string[] = ((p?.product_images ?? []) as any[])
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((img) => img.image_url)
      .filter(Boolean);
    const mainImage = images[0];
    const price = Number(p?.offer_price ?? p?.regular_price ?? 0);
    const inStock = p?.track_stock ? Number(p?.stock_quantity ?? 0) > 0 : true;

    const productLd: any = p && {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.title,
      description: desc,
      sku: p.sku || p.id,
      ...(mainImage ? { image: images } : {}),
      brand: { "@type": "Brand", name: "DDS-Digital" },
      offers: {
        "@type": "Offer",
        url,
        priceCurrency: "BDT",
        price,
        availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@type": "Organization", name: "DDS-Digital" },
      },
      ...(Number(p.total_reviews) > 0 && Number(p.average_rating) > 0
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: Number(p.average_rating).toFixed(1),
              reviewCount: Number(p.total_reviews),
            },
          }
        : {}),
    };

    const breadcrumbLd = p && {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "হোম", item: SITE },
        { "@type": "ListItem", position: 2, name: "শপ", item: `${SITE}/shop` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    };

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        ...(mainImage ? [{ property: "og:image", content: mainImage } as const] : []),
        ...(mainImage ? [{ name: "twitter:image", content: mainImage } as const] : []),
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(price > 0 ? [{ property: "product:price:amount", content: String(price) } as const, { property: "product:price:currency", content: "BDT" } as const] : []),
        { property: "product:availability", content: inStock ? "in stock" : "out of stock" },
      ],
      links: p ? [{ rel: "canonical", href: url }] : [],
      scripts: p
        ? [
            { type: "application/ld+json", children: JSON.stringify(productLd) },
            { type: "application/ld+json", children: JSON.stringify(breadcrumbLd) },
          ]
        : [],
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
  const isSubscription = (product as any)?.delivery_type === "subscription";
  const plans = (((product as any)?.subscription_plans ?? []) as any[])
    .filter((p) => p.is_active)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const [variantId, setVariantId] = useState<string | null>(product?.product_variants?.[0]?.id ?? null);
  const [planId, setPlanId] = useState<string | null>(plans[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const { data: reviews = [] } = useQuery(productReviewsQuery(product?.id));
  const { data: related = [] } = useQuery(productsQuery({ limit: 4 }));
  const { addItem } = useCart();
  const navigate = useNavigate();

  if (!product) return null;
  const images = (product.product_images ?? []).sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const variants = (product.product_variants ?? []).filter((v: any) => v.is_active);
  const selectedVariant = variants.find((v: any) => v.id === variantId);
  const selectedPlan = plans.find((p) => p.id === planId);
  const unitRegular = isSubscription && selectedPlan
    ? Number(selectedPlan.price)
    : (selectedVariant?.regular_price ?? product.regular_price ?? selectedVariant?.offer_price ?? product.offer_price);
  const unitOffer = isSubscription && selectedPlan
    ? Number(selectedPlan.price)
    : (selectedVariant?.offer_price ?? product.offer_price ?? selectedVariant?.regular_price ?? product.regular_price);
  const unitPrice = unitOffer ?? unitRegular;
  const qtyMul = isSubscription ? 1 : qty;
  const price = Number(unitPrice ?? 0) * qtyMul;
  const regularTotal = Number(unitRegular ?? 0) * qtyMul;
  const hasDiscount = !isSubscription && unitOffer != null && unitRegular != null && Number(unitOffer) < Number(unitRegular);

  // Out-of-stock detection
  const trackStock = !!(product as any).track_stock;
  const productStock = (product as any).stock_quantity;
  const selectedVariantStock = selectedVariant?.stock_quantity;
  const selectedStock = !trackStock
    ? null
    : isSubscription
      ? null
      : (variants.length > 0 ? selectedVariantStock : productStock);
  const isOutOfStock = trackStock && !isSubscription && (
    variants.length > 0
      ? variants.every((v: any) => v.stock_quantity != null && Number(v.stock_quantity) <= 0)
      : (productStock ?? 0) <= 0
  );
  const selectedIsOut = trackStock && !isSubscription && selectedStock != null && Number(selectedStock) <= 0;
  const maxQty = selectedStock != null ? Math.max(1, Number(selectedStock)) : 99;


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
            {isOutOfStock && <span className="rounded-full bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground">OUT OF STOCK</span>}
            {!isOutOfStock && selectedStock != null && Number(selectedStock) > 0 && Number(selectedStock) <= 5 && (
              <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">শুধু {selectedStock} টা বাকি</span>
            )}
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

          <RecentSalesCount productId={product.id} />


          {product.short_description && (
            <p className="mt-4 text-muted-foreground leading-relaxed">{product.short_description}</p>
          )}

          <div className="mt-6 glass-card rounded-2xl p-5">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display font-bold text-4xl text-gradient-brand">{formatBDT(price)}</span>
              {hasDiscount && (
                <span className="text-lg text-muted-foreground line-through">{formatBDT(regularTotal)}</span>
              )}
              {!isSubscription && qty > 1 && (
                <span className="text-xs text-muted-foreground">({formatBDT(unitPrice)} × {qty})</span>
              )}
            </div>

            {isSubscription && plans.length > 0 && (
              <div className="mt-5">
                <div className="text-xs font-semibold mb-2 inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" /> সাবস্ক্রিপশন প্ল্যান বেছে নিন
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {plans.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => setPlanId(p.id)}
                      className={`rounded-xl px-4 py-3 text-left transition border ${planId === p.id ? "bg-gradient-brand text-primary-foreground shadow-glow border-transparent" : "glass hover:bg-accent border-border/60"}`}
                    >
                      <div className="text-sm font-bold">{p.name}</div>
                      <div className="text-xs opacity-80 mt-0.5">{p.duration_days} দিন · {formatBDT(Number(p.price))}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isSubscription && variants.length > 0 && (
              <div className="mt-5">
                <div className="text-xs font-semibold mb-2">ভ্যারিয়েন্ট নির্বাচন করুন</div>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v: any) => {
                    const vStock = v.stock_quantity;
                    const vOut = vStock != null && Number(vStock) <= 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => setVariantId(v.id)}
                        disabled={vOut}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${variantId === v.id ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass hover:bg-accent"} disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {v.label} · {formatBDT(v.offer_price ?? v.regular_price)}
                        {vStock != null && (
                          <span className="ml-1.5 text-[10px] opacity-80">({vOut ? "শেষ" : `${vStock} টি`})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedVariant?.stock_quantity != null && Number(selectedVariant.stock_quantity) > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    স্টকে আছে: <span className="font-semibold text-foreground">{selectedVariant.stock_quantity} টি</span>
                  </div>
                )}
              </div>
            )}

            {!isSubscription && variants.length === 0 && productStock != null && Number(productStock) > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                স্টকে আছে: <span className="font-semibold text-foreground">{productStock} টি</span>
              </div>
            )}

            {!isSubscription && (
              <div className="mt-5 flex items-center gap-3">
                <span className="text-xs font-semibold">পরিমাণ</span>
                <div className="inline-flex items-center rounded-xl glass">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-accent rounded-l-xl" aria-label="কমান">−</button>
                  <span className="px-4 py-2 text-sm font-semibold min-w-[2.5rem] text-center">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="px-3 py-2 hover:bg-accent rounded-r-xl disabled:opacity-40" disabled={qty >= maxQty} aria-label="বাড়ান">+</button>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                disabled={(isSubscription && !selectedPlan) || isOutOfStock || selectedIsOut}
                onClick={() => {
                  if (isSubscription && !selectedPlan) {
                    toast.error("প্ল্যান বেছে নিন");
                    return;
                  }
                  addItem({
                    productId: product.id,
                    slug: product.slug,
                    title: product.title,
                    price: Number(unitPrice ?? 0),
                    image: images[0]?.image_url ?? null,
                    variantId: isSubscription ? null : selectedVariant?.id ?? null,
                    variantLabel: isSubscription ? null : selectedVariant?.label ?? null,
                    planId: isSubscription ? selectedPlan?.id ?? null : null,
                    planLabel: isSubscription ? selectedPlan?.name ?? null : null,
                    quantity: isSubscription ? 1 : qty,
                  });
                  navigate({ to: "/checkout" });
                }}
                className="flex-1 min-w-[180px] rounded-2xl bg-gradient-brand px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="h-4 w-4" /> {isOutOfStock || selectedIsOut ? "স্টকে নেই" : isSubscription ? "এখনই সাবস্ক্রাইব করুন" : "এখনই কিনুন"}
              </button>
              {!isSubscription && (
                <button
                  disabled={isOutOfStock || selectedIsOut}
                  onClick={() => {
                    addItem({
                      productId: product.id,
                      slug: product.slug,
                      title: product.title,
                      price: Number(unitPrice ?? 0),
                      image: images[0]?.image_url ?? null,
                      variantId: selectedVariant?.id ?? null,
                      variantLabel: selectedVariant?.label ?? null,
                      quantity: qty,
                    });
                    toast.success("কার্টে যোগ হয়েছে");
                  }}
                  className="rounded-2xl glass-card px-5 py-3.5 text-sm font-semibold hover:bg-accent transition inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="h-4 w-4" /> কার্টে যোগ
                </button>
              )}
              <button className="rounded-2xl glass-card px-4 py-3.5 hover:bg-accent transition" aria-label="Wishlist">
                <Heart className="h-4 w-4" />
              </button>
            </div>

            {(isOutOfStock || selectedIsOut) && !isSubscription && (
              <div className="mt-4">
                <BackInStockNotify productId={product.id} variantId={selectedVariant?.id ?? null} />
              </div>
            )}
          </div>

          {!isSubscription && variants.length >= 2 && (
            <VariantCompareTable
              variants={variants as any}
              selectedId={variantId}
              onSelect={setVariantId}
              trackStock={trackStock}
            />
          )}


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
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <VerifiedBuyerBadge size="xs" />
                </div>
                <p className="text-sm">{r.review_text}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(r.created_at!).toLocaleDateString("bn-BD")}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Product Q&A */}
      <ProductQA productId={product.id} />

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

      <RecentlyViewed excludeId={product.id} />

      <ProductStickyBar
        title={product.title}
        image={images[0]?.image_url ?? null}
        price={Number(unitPrice ?? 0)}
        regularPrice={hasDiscount ? Number(unitRegular ?? 0) : null}
        disabled={(isSubscription && !selectedPlan) || isOutOfStock || selectedIsOut}
        disabledLabel={isOutOfStock || selectedIsOut ? "স্টকে নেই" : "প্ল্যান বেছে নিন"}
        ctaLabel={isSubscription ? "সাবস্ক্রাইব" : "কার্টে যোগ"}
        onAdd={() => {
          if (isSubscription && !selectedPlan) { toast.error("প্ল্যান বেছে নিন"); return; }
          addItem({
            productId: product.id,
            slug: product.slug,
            title: product.title,
            price: Number(unitPrice ?? 0),
            image: images[0]?.image_url ?? null,
            variantId: isSubscription ? null : selectedVariant?.id ?? null,
            variantLabel: isSubscription ? null : selectedVariant?.label ?? null,
            planId: isSubscription ? selectedPlan?.id ?? null : null,
            planLabel: isSubscription ? selectedPlan?.name ?? null : null,
            quantity: isSubscription ? 1 : qty,
          });
          toast.success("কার্টে যোগ হয়েছে");
        }}
      />
    </div>

  );
}

function ProductQA({ productId }: { productId: string }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const ask = useServerFn(askQuestion);
  const answer = useServerFn(answerQuestion);
  const { data: questions = [] } = useQuery(productQuestionsQuery(productId));
  const { data: isAdmin = false } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return false;
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "super_admin", "moderator"])
        .eq("is_active", true);
      return (data?.length ?? 0) > 0;
    },
  });

  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [answerDraft, setAnswerDraft] = useState<Record<string, string>>({});

  const submit = async () => {
    if (!user) { toast.error("প্রশ্ন করার জন্য সাইন-ইন করুন"); return; }
    if (q.trim().length < 3) { toast.error("প্রশ্ন একটু বিস্তারিত লিখুন"); return; }
    setBusy(true);
    try {
      await ask({ data: { product_id: productId, question: q.trim() } });
      setQ("");
      toast.success("প্রশ্ন পাঠানো হয়েছে");
      qc.invalidateQueries({ queryKey: ["product_questions", productId] });
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const submitAnswer = async (id: string) => {
    const text = (answerDraft[id] ?? "").trim();
    if (!text) return;
    try {
      await answer({ data: { id, answer: text } });
      setAnswerDraft((d) => ({ ...d, [id]: "" }));
      qc.invalidateQueries({ queryKey: ["product_questions", productId] });
      toast.success("উত্তর সেভ হয়েছে");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <section className="mt-12">
      <h2 className="font-display font-bold text-2xl mb-4 inline-flex items-center gap-2">
        <MessageCircleQuestion className="h-6 w-6 text-primary" /> প্রশ্ন ও উত্তর
      </h2>

      <div className="glass-card rounded-2xl p-5 mb-4">
        <label className="block text-sm font-semibold mb-2">আপনার প্রশ্ন</label>
        <textarea
          value={q}
          onChange={(e) => setQ(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={user ? "এই প্রোডাক্ট সম্পর্কে কিছু জানতে চান?" : "প্রশ্ন করতে আগে সাইন-ইন করুন"}
          disabled={!user}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
        />
        <div className="mt-3 flex justify-end">
          <button
            onClick={submit}
            disabled={busy || !user}
            className="rounded-xl bg-gradient-brand text-primary-foreground px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> {busy ? "পাঠানো হচ্ছে..." : "প্রশ্ন পাঠান"}
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          এখনো কোনো প্রশ্ন নেই। প্রথম প্রশ্ন আপনি করুন!
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((qa: any) => (
            <div key={qa.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-xs font-bold text-primary-foreground shrink-0">
                  {(qa.user_name ?? "U").slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{qa.user_name ?? "Customer"}</span>
                    <span className="text-xs text-muted-foreground">{new Date(qa.created_at).toLocaleDateString("bn-BD")}</span>
                  </div>
                  <p className="mt-1 text-sm">{qa.question}</p>

                  {qa.answer ? (
                    <div className="mt-3 rounded-xl bg-primary/5 border border-primary/20 p-3">
                      <div className="text-xs font-bold text-primary mb-1">✓ অ্যাডমিনের উত্তর</div>
                      <p className="text-sm leading-relaxed">{qa.answer}</p>
                    </div>
                  ) : isAdmin ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={answerDraft[qa.id] ?? ""}
                        onChange={(e) => setAnswerDraft((d) => ({ ...d, [qa.id]: e.target.value }))}
                        placeholder="উত্তর লিখুন..."
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => submitAnswer(qa.id)}
                        className="rounded-lg bg-gradient-brand text-primary-foreground px-3 py-2 text-xs font-bold"
                      >
                        উত্তর দিন
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground italic">এখনো উত্তর দেয়া হয়নি</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
