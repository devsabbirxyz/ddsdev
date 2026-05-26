import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Zap, ShieldCheck, Headphones, Users, BadgeCheck, ArrowRight, Star, Mail, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { productsQuery, blogPostsQuery, reviewSlidesQuery, categoriesQuery } from "@/lib/storefront";
import { siteSettingsQuery, parseTrustBar, parsePromoSection, HOMEPAGE_KEYS } from "@/lib/site-settings";
import { ProductCard } from "@/components/storefront/ProductCard";
import { OfferBannerSlider } from "@/components/storefront/OfferBannerSlider";
import { OfferPopup } from "@/components/storefront/OfferPopup";
import { CountdownBanner } from "@/components/storefront/CountdownBanner";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DDS-Digital — Bangladesh's #1 Digital Product Store" },
      { name: "description", content: "DDS-Digital (Dev Sabbir Soft) — বাংলাদেশের ১ নম্বর ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস। সাবস্ক্রিপশন, সফটওয়্যার, অ্যাকাউন্ট সবকিছু এক জায়গায়।" },
      { property: "og:title", content: "DDS-Digital — Bangladesh's #1 Digital Product Store" },
      { property: "og:description", content: "বাংলাদেশের ১ নম্বর ডিজিটাল প্রোডাক্ট সেলিং প্ল্যাটফর্ম। ইনস্ট্যান্ট ডেলিভারি, সিকিউর পেমেন্ট, ২৪/৭ সাপোর্ট।" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "DDS-Digital",
        alternateName: "Dev Sabbir Soft",
        description: "Bangladesh's Number 1 Digital Product Selling System",
        areaServed: "BD",
      }),
    }],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useI18n();
  const { data: featured = [] } = useQuery(productsQuery({ featured: true, limit: 8 }));
  const { data: latest = [] } = useQuery(productsQuery({ sort: "new", limit: 4 }));
  const { data: posts = [] } = useQuery(blogPostsQuery(3));
  const { data: slides = [] } = useQuery(reviewSlidesQuery());
  const { data: settings = {} } = useQuery(siteSettingsQuery);
  const { data: categories = [] } = useQuery(categoriesQuery());

  const products = featured.length > 0 ? featured : latest;

  const defaultTrust = [
    { icon: "BadgeCheck", label: "Best Quality", sub: "100% Authentic" },
    { icon: "ShieldCheck", label: "Secure Payments", sub: "Bkash • Nagad • Rocket" },
    { icon: "Headphones", label: "24/7 Support", sub: "Anydesk / Teamviewer" },
    { icon: "Zap", label: "Instant Delivery", sub: "অটো ডেলিভারি" },
    { icon: "Users", label: "1000+ Customers", sub: "Happy & Trusted" },
    { icon: "Star", label: "Top Rated", sub: "5★ Reviews" },
  ];
  const trustParsed = parseTrustBar(settings[HOMEPAGE_KEYS.trust_bar]);
  const trustItems = (trustParsed.length > 0 ? trustParsed : defaultTrust).map((it) => ({
    icon: (LucideIcons as any)[it.icon] ?? BadgeCheck,
    label: it.label,
    sub: it.sub,
  }));

  const heroBadge = settings[HOMEPAGE_KEYS.hero_badge] || t("hero_badge");
  const heroTagline = settings[HOMEPAGE_KEYS.hero_tagline] || `${t("tagline")} — সাবস্ক্রিপশন, সফটওয়্যার, অ্যাকাউন্ট, ডাউনলোডেবল প্রোডাক্ট সবকিছু এক জায়গায়। ইনস্ট্যান্ট অটো ডেলিভারি।`;
  const ctaPrimary = settings[HOMEPAGE_KEYS.hero_cta_primary] || t("shop_now");
  const ctaSecondary = settings[HOMEPAGE_KEYS.hero_cta_secondary] || "আরও জানুন";
  const ctaSecondaryLink = settings[HOMEPAGE_KEYS.hero_cta_secondary_link] || "/dashboard";
  const announcement = settings[HOMEPAGE_KEYS.announcement] || "🎉 লঞ্চিং অফার — প্রথম ১০০ অর্ডারে ১৫% ছাড়, কুপন কোড: DDS15";

  return (
    <>
      <OfferPopup />
      <CountdownBanner />
      {/* Announcement bar */}
      <div className="bg-gradient-brand text-primary-foreground text-center text-xs sm:text-sm py-2 px-4 font-medium">
        {announcement}
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-90 pointer-events-none" />
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px] pointer-events-none" />
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-secondary/30 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {heroBadge}
          </div>

          {/* Offer banner — auto-sliding carousel */}
          <div className="relative mt-8">
            <div className="relative rounded-3xl shadow-glow">
              <OfferBannerSlider />
            </div>
          </div>



          <p className="mt-8 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">{heroTagline}</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/shop" className="rounded-2xl bg-gradient-brand px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-105 transition inline-flex items-center gap-2">
              {ctaPrimary} <ArrowRight className="h-4 w-4" />
            </Link>
            {ctaSecondaryLink.startsWith("http") ? (
              <a href={ctaSecondaryLink} target="_blank" rel="noopener noreferrer" className="rounded-2xl glass-card px-7 py-3.5 text-sm font-semibold hover:bg-accent transition">{ctaSecondary}</a>
            ) : (
              <Link to={ctaSecondaryLink as any} className="rounded-2xl glass-card px-7 py-3.5 text-sm font-semibold hover:bg-accent transition">{ctaSecondary}</Link>
            )}
          </div>
        </div>
      </section>


      {/* CATEGORIES */}
      {categories.length > 0 && (
        <section className="py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="text-xs text-primary font-bold uppercase tracking-wider">🗂️ ক্যাটাগরি</div>
                <h2 className="mt-1 font-display font-bold text-2xl sm:text-3xl">
                  ব্রাউজ করুন <span className="text-gradient-brand">ক্যাটাগরি</span>
                </h2>
              </div>
              <Link to="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                সব দেখুন <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {categories.slice(0, 12).map((c: any) => (
                <Link
                  key={c.id}
                  to="/shop"
                  search={{ category: c.slug } as any}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-4 shadow-lg hover:bg-white/15 hover:shadow-glow transition"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-brand text-primary-foreground overflow-hidden shrink-0">
                    {c.icon_url ? (
                      <img src={c.icon_url} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-lg">{c.name?.slice(0, 1)}</span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-center line-clamp-2 group-hover:text-primary transition-colors">
                    {c.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="text-center mb-8 mx-auto max-w-2xl">
          <div className="text-xs text-primary font-bold uppercase tracking-wider">⭐ ফিচারড</div>
          <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl">
            সেরা <span className="text-gradient-brand">প্রোডাক্টসমূহ</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">আমাদের জনপ্রিয় ফ্রি ও প্রিমিয়াম ডিজিটাল প্রোডাক্টসমূহ দেখুন।</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.slice(0, 6).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/shop" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            সব দেখুন <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* TRUST BAR — glassmorphism */}
      <section className="pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Mobile: marquee */}
          <div className="md:hidden overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="flex gap-3 w-max animate-marquee">
              {[...trustItems, ...trustItems].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl px-4 py-3 shadow-lg shrink-0"
                  >
                    <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold whitespace-nowrap">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground whitespace-nowrap">{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Desktop: single row */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-3">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-3 shadow-lg hover:bg-white/15 transition"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SPECIAL OFFER */}
      {(() => {
        const promo = parsePromoSection(settings[HOMEPAGE_KEYS.promo_section]);
        if (!promo.enabled) return null;
        const descParts = promo.description.split("{coupon}");
        return (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-8 sm:p-12 text-primary-foreground">
              <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="relative grid md:grid-cols-2 gap-6 items-center">
                <div>
                  {promo.badge && (
                    <div className="inline-block rounded-full bg-white/20 backdrop-blur px-3 py-1 text-xs font-bold mb-3">{promo.badge}</div>
                  )}
                  <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">{promo.heading}</h2>
                  {promo.description && (
                    <p className="mt-3 opacity-90 text-sm sm:text-base">
                      {descParts[0]}
                      {descParts.length > 1 && promo.coupon_code && (
                        <span className="font-bold bg-white/20 px-2 py-0.5 rounded">{promo.coupon_code}</span>
                      )}
                      {descParts.slice(1).join("{coupon}")}
                    </p>
                  )}
                  {promo.button_text && (
                    <Link to={promo.button_link || "/shop"} className="mt-6 inline-block rounded-2xl bg-white text-primary px-6 py-3 text-sm font-bold hover:scale-105 transition">
                      {promo.button_text}
                    </Link>
                  )}
                </div>
                {promo.stats.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {promo.stats.slice(0, 3).map((s, i) => (
                      <div key={i} className="rounded-2xl bg-white/15 backdrop-blur p-4">
                        <div className="font-display font-bold text-2xl sm:text-3xl">{s.value}</div>
                        <div className="text-xs opacity-90 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })()}

      {/* HOW TO BUY */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-16">
        <div className="text-center mb-8">
          <div className="text-xs text-primary font-bold uppercase tracking-wider">🛒 গাইড</div>
          <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl">
            How to <span className="text-gradient-brand">Buy</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">ভিডিওটি দেখুন — কয়েক মিনিটেই অর্ডার সম্পূর্ণ করুন।</p>
        </div>
        <div className="glass-card rounded-3xl p-2 sm:p-3 shadow-glow">
          <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="How to Buy"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </div>
      </section>



      {/* REVIEWS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="text-center mb-10">
          <div className="text-xs text-primary font-bold uppercase tracking-wider">💬 রিভিউ</div>
          <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl">
            কাস্টমাররা কী <span className="text-gradient-brand">বলছেন</span>
          </h2>
        </div>
        {(() => {
          const reviews = (slides.length > 0 ? slides : [
            { id: "r1", customer_name: "রাকিব হাসান", rating: 5, review_text: "অর্ডার দেওয়ার সাথে সাথে ডেলিভারি পেলাম। দারুণ সার্ভিস!", product_name: "Netflix Premium" },
            { id: "r2", customer_name: "তানভীর আহমেদ", rating: 5, review_text: "প্রাইস সবচেয়ে কম, কোয়ালিটি একদম পারফেক্ট।", product_name: "ChatGPT Plus" },
            { id: "r3", customer_name: "সাবিনা ইয়াসমিন", rating: 5, review_text: "সাপোর্ট টিম খুবই হেল্পফুল। সবাইকে রিকমেন্ড করব।", product_name: "Canva Pro" },
          ]);
          const ReviewCard = ({ r }: { r: any }) => (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < (r.rating ?? 5) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <p className="text-sm leading-relaxed">"{r.review_text}"</p>
              <div className="mt-4 flex items-center gap-3 pt-4 border-t border-glass-border">
                <div className="h-10 w-10 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground font-bold text-sm">
                  {(r.customer_name || "U").slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{r.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{r.product_name}</div>
                </div>
              </div>
            </div>
          );
          return (
            <>
              {/* Desktop grid */}
              <div className="hidden md:grid md:grid-cols-3 gap-5">
                {reviews.slice(0, 3).map((r: any) => <ReviewCard key={r.id} r={r} />)}
              </div>
              {/* Mobile vertical marquee */}
              <div className="md:hidden relative h-[520px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]">
                <div className="animate-marquee-y flex flex-col gap-4">
                  {[...reviews, ...reviews].map((r: any, i: number) => (
                    <ReviewCard key={`${r.id}-${i}`} r={r} />
                  ))}
                </div>
              </div>
            </>
          );
        })()}

      </section>

      {/* NEWSLETTER */}
      {settings[HOMEPAGE_KEYS.newsletter_enabled] !== "false" && (
        <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-16">
          <Newsletter heading={settings[HOMEPAGE_KEYS.newsletter_heading]} sub={settings[HOMEPAGE_KEYS.newsletter_sub]} />
        </section>
      )}

      {/* BLOG */}
      {posts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-xs text-primary font-bold uppercase tracking-wider">📝 ব্লগ</div>
              <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl">
                Latest <span className="text-gradient-brand">Blog Posts</span>
              </h2>
            </div>
            <Link to="/blog" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              সব পড়ুন <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {posts.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                to="/blog/$slug"
                params={{ slug: p.slug }}
                className="group glass-card rounded-2xl overflow-hidden hover:shadow-glow transition flex flex-col"
              >
                <div className="aspect-video w-full bg-gradient-glow grid place-items-center overflow-hidden">
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="text-5xl font-display font-bold text-gradient-brand opacity-25">{p.title.slice(0, 1)}</div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-base line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
                  {p.short_description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.short_description}</p>}
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                    Read More <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}


function Newsletter({ heading, sub }: { heading?: string; sub?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("err"); setMsg("সঠিক ইমেইল দিন");
      return;
    }
    setState("loading");
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    if (error) {
      setState("err");
      setMsg(error.code === "23505" ? "এই ইমেইল ইতিমধ্যে সাবস্ক্রাইব করা আছে" : "সমস্যা হয়েছে — পরে চেষ্টা করুন");
    } else {
      setState("ok"); setMsg("সফলভাবে সাবস্ক্রাইব হয়েছে! 🎉");
      setEmail("");
    }
  }

  return (
    <div className="glass-card rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-50 pointer-events-none" />
      <div className="relative">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow mb-4">
          <Mail className="h-7 w-7 text-primary-foreground" />
        </div>
        <h2 className="font-display font-bold text-2xl sm:text-3xl">{heading || "নতুন অফারের আপডেট পেতে চান?"}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{sub || "আমাদের নিউজলেটার সাবস্ক্রাইব করুন — সব নতুন প্রোডাক্ট ও স্পেশাল অফার সবার আগে।"}</p>


        <form onSubmit={submit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="আপনার ইমেইল"
            className="flex-1 rounded-xl glass px-4 py-3 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <button
            type="submit"
            disabled={state === "loading"}
            className="rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-105 transition disabled:opacity-60"
          >
            {state === "loading" ? "..." : "সাবস্ক্রাইব করুন"}
          </button>
        </form>
        {msg && (
          <p className={`mt-3 text-xs inline-flex items-center gap-1 ${state === "ok" ? "text-primary" : "text-destructive"}`}>
            {state === "ok" && <CheckCircle2 className="h-3 w-3" />}
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

