// New homepage sections — Flash Deals, Best Sellers, Just Arrived, Live Stats,
// Testimonials Highlight, FAQ Accordion, Bundle Offers.
// Uses existing storefront queries + supabase reads; semantic design tokens only.

import { Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Flame, TrendingUp, Sparkles, Users, Star, ShieldCheck, Package,
  ArrowRight, ChevronDown, Quote, Gift,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery, faqsQuery, formatBDT } from "@/lib/storefront";
import { bundlesQuery } from "@/lib/bundles";
import { ProductCard } from "./ProductCard";
import { VerifiedBuyerBadge } from "./TrustBadges";

/* ============ FLASH DEALS — countdown + high-discount products ============ */
export function FlashDeals() {
  const { data: products = [] } = useQuery(productsQuery({ limit: 24 }));
  const deals = useMemo(() => {
    return products
      .filter((p: any) => p.regular_price && p.offer_price && p.offer_price < p.regular_price)
      .map((p: any) => ({
        ...p,
        _discount: Math.round(((p.regular_price - p.offer_price) / p.regular_price) * 100),
      }))
      .sort((a: any, b: any) => b._discount - a._discount)
      .slice(0, 6);
  }, [products]);

  // 24-hour rolling countdown (resets daily)
  const [time, setTime] = useState(() => secondsUntilMidnight());
  useEffect(() => {
    const t = setInterval(() => setTime(secondsUntilMidnight()), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(time / 3600);
  const m = Math.floor((time % 3600) / 60);
  const s = time % 60;

  if (deals.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="glass-card rounded-3xl p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="text-xs text-primary font-bold uppercase tracking-wider">⚡ ফ্ল্যাশ ডিল</div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl">
                আজকের <span className="text-gradient-brand">সেরা অফার</span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-muted-foreground hidden sm:inline">শেষ হবে:</span>
            {[["ঘ", h], ["মি", m], ["সে", s]].map(([label, val]) => (
              <div key={label as string} className="flex flex-col items-center rounded-xl bg-gradient-brand text-primary-foreground px-2.5 py-1.5 min-w-[44px]">
                <span className="font-display font-bold text-base tabular-nums">{String(val).padStart(2, "0")}</span>
                <span className="text-[9px] opacity-80">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {deals.map((p: any) => {
            const stock = Number(p.stock_quantity ?? p.stock ?? 0);
            const lowStock = stock > 0 && stock <= 10;
            return (
              <div key={p.id} className="relative">
                <div className="absolute -top-2 -right-2 z-10 rounded-full bg-destructive text-destructive-foreground px-3 py-1 text-xs font-bold shadow-glow rotate-3">
                  -{p._discount}%
                </div>
                {lowStock && (
                  <div className="absolute -top-2 left-2 z-10 rounded-full bg-gradient-brand text-primary-foreground px-2.5 py-1 text-[10px] font-bold shadow-glow animate-pulse">
                    🔥 মাত্র {stock} টি বাকি
                  </div>
                )}
                <ProductCard p={p} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function secondsUntilMidnight() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}

/* ============ BEST SELLERS ============ */
export function BestSellers() {
  const { data: products = [], isLoading } = useQuery(productsQuery({ sort: "best", limit: 8 }));
  if (!isLoading && products.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="text-center mb-8 mx-auto max-w-2xl">
        <div className="text-xs text-primary font-bold uppercase tracking-wider flex items-center justify-center gap-2">
          <TrendingUp className="h-3.5 w-3.5" /> বেস্টসেলার
        </div>
        <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl">
          সবচেয়ে বেশি <span className="text-gradient-brand">বিক্রিত প্রোডাক্ট</span>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">হাজারো কাস্টমার এগুলোই বেছে নিয়েছেন।</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.slice(0, 8).map((p: any, i: number) => (
          <div key={p.id} className="relative">
            {i < 3 && (
              <div className="absolute -top-2 -left-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-gradient-brand text-primary-foreground font-display font-bold text-sm shadow-glow">
                #{i + 1}
              </div>
            )}
            <ProductCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============ JUST ARRIVED ============ */
export function JustArrived() {
  const { data: products = [] } = useQuery(productsQuery({ sort: "new", limit: 8 }));
  const fresh = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return products.filter((p: any) => new Date(p.created_at).getTime() >= cutoff).slice(0, 4);
  }, [products]);
  if (fresh.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" /> নতুন এসেছে
          </div>
          <h2 className="mt-1 font-display font-bold text-2xl sm:text-3xl">
            Just <span className="text-gradient-brand">Arrived</span>
          </h2>
        </div>
        <Link to="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          সব দেখুন <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {fresh.map((p: any) => (
          <div key={p.id} className="relative">
            <div className="absolute top-2 left-2 z-10 rounded-full bg-gradient-brand text-primary-foreground px-2.5 py-0.5 text-[10px] font-bold shadow-glow">
              NEW
            </div>
            <ProductCard p={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============ LIVE STATS COUNTER ============ */
const liveStatsQuery = queryOptions({
  queryKey: ["home_live_stats"],
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const [ordersToday, customers, reviews, products] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("reviews").select("rating").eq("is_active", true).limit(1000),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    const ratings = (reviews.data ?? []).map((r: any) => r.rating).filter(Boolean);
    const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 4.9;
    return {
      ordersToday: ordersToday.count ?? 0,
      customers: customers.count ?? 0,
      avgRating: Number(avgRating.toFixed(1)),
      products: products.count ?? 0,
    };
  },
});

function useCounter(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const start = useRef<number | null>(null);
  useEffect(() => {
    start.current = null;
    let raf = 0;
    const tick = (ts: number) => {
      if (start.current == null) start.current = ts;
      const p = Math.min(1, (ts - start.current) / duration);
      setVal(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function LiveStats() {
  const { data } = useQuery(liveStatsQuery);
  const orders = useCounter(data?.ordersToday ?? 0);
  const customers = useCounter(Math.max(data?.customers ?? 0, 1500));
  const products = useCounter(Math.max(data?.products ?? 0, 0));
  const items = [
    { icon: Package, label: "আজকের অর্ডার", value: `${orders}+`, sub: "✅ ডেলিভার্ড" },
    { icon: Users, label: "হ্যাপি কাস্টমার", value: `${customers}+`, sub: "🇧🇩 বাংলাদেশজুড়ে" },
    { icon: Star, label: "এভারেজ রেটিং", value: (data?.avgRating ?? 4.9).toFixed(1) + "★", sub: "৫ এ ৫" },
    { icon: ShieldCheck, label: "সিকিউর পেমেন্ট", value: "১০০%", sub: "এসএসএল প্রটেক্টেড" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 -mt-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.label} className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:shadow-glow transition">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shrink-0">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-xl sm:text-2xl text-gradient-brand tabular-nums leading-tight">{it.value}</div>
                <div className="text-[11px] sm:text-xs font-semibold truncate">{it.label}</div>
                <div className="text-[10px] text-muted-foreground truncate">{it.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============ TESTIMONIALS HIGHLIGHT ============ */
const featuredTestimonialsQuery = queryOptions({
  queryKey: ["home_featured_testimonials"],
  staleTime: 5 * 60_000,
  queryFn: async () => {
    const { data } = await supabase
      .from("reviews")
      .select("id,rating,review_text,created_at, products(title)")
      .eq("is_active", true)
      .gte("rating", 5)
      .not("review_text", "is", null)
      .order("created_at", { ascending: false })
      .limit(3);
    return data ?? [];
  },
});

const FALLBACK_TESTIMONIALS = [
  { id: "t1", rating: 5, review_text: "এক মিনিটে অর্ডার, এক মিনিটেই ডেলিভারি। দারুণ অভিজ্ঞতা!", users: { full_name: "মাহমুদুল হাসান" }, products: { title: "Netflix Premium" } },
  { id: "t2", rating: 5, review_text: "প্রাইস সবার চেয়ে কম, সাপোর্ট ২৪/৭ — পুরোপুরি বিশ্বস্ত প্ল্যাটফর্ম।", users: { full_name: "সাবিনা ইয়াসমিন" }, products: { title: "Canva Pro" } },
  { id: "t3", rating: 5, review_text: "৫+ অর্ডার দিয়েছি এখন পর্যন্ত, একটাও সমস্যা হয়নি। হাইলি রিকমেন্ডেড।", users: { full_name: "তানভীর আহমেদ" }, products: { title: "ChatGPT Plus" } },
];

export function TestimonialsHighlight() {
  const { data: live = [] } = useQuery(featuredTestimonialsQuery);
  const items = live.length >= 3 ? live : FALLBACK_TESTIMONIALS;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14">
      <div className="text-center mb-10 mx-auto max-w-2xl">
        <div className="text-xs text-primary font-bold uppercase tracking-wider">⭐ টেস্টিমোনিয়াল</div>
        <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl">
          আমাদের <span className="text-gradient-brand">কাস্টমারদের গল্প</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        {items.slice(0, 3).map((r: any, i: number) => (
          <div key={r.id} className={`glass-card rounded-3xl p-6 relative hover:shadow-glow transition ${i === 1 ? "md:-translate-y-3 shadow-glow" : ""}`}>
            <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, k) => (
                <Star key={k} className={`h-4 w-4 ${k < (r.rating ?? 5) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <p className="text-sm leading-relaxed font-medium">"{r.review_text}"</p>
            <div className="mt-5 flex items-center gap-3 pt-4 border-t border-glass-border">
              <div className="h-11 w-11 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground font-bold">
                {(r.users?.full_name || "U").slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{r.users?.full_name || "ভেরিফায়েড কাস্টমার"}</div>
                <div className="text-xs text-muted-foreground truncate">{r.products?.title || "ভেরিফায়েড পার্চেজ"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ============ HOME FAQ ACCORDION ============ */
const FALLBACK_FAQS = [
  { id: "f1", question: "অর্ডার দিলে কতক্ষণে ডেলিভারি পাব?", answer: "অধিকাংশ ডিজিটাল প্রোডাক্ট অর্ডার কনফার্ম হওয়ার পরপরই অটোমেটিক্যালি ইমেইল/ড্যাশবোর্ডে চলে আসে। ম্যানুয়াল প্রোডাক্ট ১-৩ ঘণ্টায়।" },
  { id: "f2", question: "কী কী পেমেন্ট মেথড সাপোর্ট করেন?", answer: "বিকাশ, নগদ, রকেট, উপায় — সব মোবাইল ব্যাংকিং এবং কার্ড পেমেন্ট সাপোর্ট করি।" },
  { id: "f3", question: "প্রোডাক্ট কাজ না করলে কি রিফান্ড পাব?", answer: "হ্যাঁ, প্রোডাক্ট ডেলিভারির ৭ দিনের মধ্যে সমস্যা হলে রিপ্লেস বা ফুল রিফান্ড দেওয়া হয়।" },
  { id: "f4", question: "সাপোর্ট কীভাবে পাব?", answer: "২৪/৭ লাইভ চ্যাট, হোয়াটসঅ্যাপ, টেলিগ্রাম — যেকোনো সময় মেসেজ দিন, সঙ্গে সঙ্গে রিপ্লাই পাবেন।" },
  { id: "f5", question: "একই অ্যাকাউন্ট একাধিক ডিভাইসে ব্যবহার করা যাবে?", answer: "প্রোডাক্ট অনুযায়ী ভিন্ন। প্রতিটি প্রোডাক্টের ডিটেইলস পেজে স্পষ্ট লেখা আছে কয়টি ডিভাইস সাপোর্ট করে।" },
];

export function HomeFAQ() {
  const { data: live = [] } = useQuery(faqsQuery());
  const items = live.length > 0 ? live.slice(0, 6) : FALLBACK_FAQS;
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-14">
      <div className="text-center mb-8">
        <div className="text-xs text-primary font-bold uppercase tracking-wider">❓ প্রশ্নোত্তর</div>
        <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl">
          সচরাচর <span className="text-gradient-brand">জিজ্ঞাসা</span>
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">আপনার কোনো প্রশ্ন আছে? উত্তর এখানেই পাবেন।</p>
      </div>
      <div className="space-y-3">
        {items.map((f: any) => {
          const isOpen = open === f.id;
          return (
            <div key={f.id} className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : f.id)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-accent/30 transition"
              >
                <span className="font-semibold text-sm sm:text-base">{f.question}</span>
                <ChevronDown className={`h-5 w-5 text-primary shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-glass-border pt-4">
                  {f.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-center">
        <Link to="/faq" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          সব প্রশ্ন দেখুন <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

/* ============ BUNDLE OFFERS (admin-managed) ============ */
export function BundleOffers() {
  const { data: bundles = [] } = useQuery(bundlesQuery());
  if (bundles.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="text-center mb-8 mx-auto max-w-2xl">
        <div className="text-xs text-primary font-bold uppercase tracking-wider flex items-center justify-center gap-2">
          <Gift className="h-3.5 w-3.5" /> বান্ডল অফার
        </div>
        <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl">
          একসাথে কিনে <span className="text-gradient-brand">আরও বাঁচান</span>
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        {bundles.map((b) => {
          const products = (b.items || []).map((i) => i.product).filter(Boolean) as NonNullable<typeof b.items[number]["product"]>[];
          if (products.length < 2) return null;
          const total = products.reduce((s, p) => s + Number(p.offer_price || p.regular_price || 0), 0);
          const discounted = Math.round(total * (1 - Number(b.discount_percent) / 100));
          return (
            <div key={b.id} className="glass-card rounded-3xl p-6 hover:shadow-glow transition relative overflow-hidden">
              <div className="absolute top-4 right-4 rounded-full bg-gradient-brand text-primary-foreground px-3 py-1 text-xs font-bold shadow-glow">
                Save {Number(b.discount_percent)}%
              </div>
              <h3 className="font-display font-bold text-xl">{b.title}</h3>
              {b.description && <p className="text-xs text-muted-foreground mt-1">{b.description}</p>}
              <div className="mt-4 flex items-center gap-2">
                {products.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex-1 min-w-0">
                    <div className="aspect-square rounded-xl bg-muted overflow-hidden">
                      {p.product_images?.[0]?.image_url ? (
                        <img src={p.product_images[0].image_url} alt={p.title} loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-2xl">📦</div>
                      )}
                    </div>
                    <div className="text-[10px] mt-1 truncate font-medium">{p.title}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-end justify-between pt-4 border-t border-glass-border">
                <div>
                  <div className="text-xs text-muted-foreground line-through">{formatBDT(total)}</div>
                  <div className="font-display font-bold text-2xl text-gradient-brand">{formatBDT(discounted)}</div>
                </div>
                <Link
                  to="/product/$slug"
                  params={{ slug: products[0].slug }}
                  className="rounded-xl bg-gradient-brand px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-glow hover:scale-105 transition"
                >
                  বান্ডল নিন
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
