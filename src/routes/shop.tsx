import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { categoriesQuery, productsQuery } from "@/lib/storefront";
import { ProductCard, EmptyState } from "@/components/storefront/ProductCard";

type SortKey = "new" | "best" | "price_asc" | "price_desc";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "শপ — DDS-Digital" },
      { name: "description", content: "DDS-Digital এর সব ডিজিটাল প্রোডাক্ট ব্রাউজ করুন — সাবস্ক্রিপশন, সফটওয়্যার, অ্যাকাউন্ট। ইনস্ট্যান্ট ডেলিভারি ও সিকিউর পেমেন্ট।" },
      { property: "og:title", content: "শপ — DDS-Digital" },
      { property: "og:description", content: "DDS-Digital এর সব ডিজিটাল প্রোডাক্ট ব্রাউজ করুন — সাবস্ক্রিপশন, সফটওয়্যার, অ্যাকাউন্ট। ইনস্ট্যান্ট ডেলিভারি ও সিকিউর পেমেন্ট।" },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("new");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [badge, setBadge] = useState<"new" | "best" | "featured" | null>(null);

  const { data: cats = [] } = useQuery(categoriesQuery());
  const { data: products = [], isLoading } = useQuery(
    productsQuery({
      category,
      search: search || null,
      sort,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
      badge,
    })
  );

  const resetFilters = () => {
    setSearch(""); setCategory(null); setMinPrice(""); setMaxPrice(""); setBadge(null); setSort("new");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">
            <span className="text-gradient-brand">শপ</span> — সব প্রোডাক্ট
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {products.length} টি প্রোডাক্ট পাওয়া গেছে
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMobileFilters(true)}
            className="lg:hidden rounded-xl glass px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" /> ফিল্টার
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl glass px-4 py-2.5 text-sm font-medium bg-card"
          >
            <option value="new">নতুন আগে</option>
            <option value="best">বেস্ট সেলিং</option>
            <option value="price_asc">কম দাম আগে</option>
            <option value="price_desc">বেশি দাম আগে</option>
          </select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar */}
        <aside
          className={`${mobileFilters ? "fixed inset-0 z-50 bg-background/90 backdrop-blur p-4 overflow-auto" : "hidden"} lg:relative lg:inset-auto lg:block lg:bg-transparent lg:p-0`}
        >
          {mobileFilters && (
            <button onClick={() => setMobileFilters(false)} className="lg:hidden absolute top-4 right-4 glass rounded-lg p-2">
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="glass-card rounded-2xl p-5 lg:sticky lg:top-20">
            <h3 className="font-display font-bold text-base mb-4">ক্যাটাগরি</h3>
            <div className="space-y-1">
              <button
                onClick={() => { setCategory(null); setMobileFilters(false); }}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${!category ? "bg-gradient-brand text-primary-foreground font-semibold" : "hover:bg-accent"}`}
              >
                সব প্রোডাক্ট
              </button>
              {cats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setCategory(c.slug); setMobileFilters(false); }}
                  className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${category === c.slug ? "bg-gradient-brand text-primary-foreground font-semibold" : "hover:bg-accent"}`}
                >
                  {c.name}
                </button>
              ))}
              {cats.length === 0 && (
                <p className="text-xs text-muted-foreground">কোনো ক্যাটাগরি নেই</p>
              )}
            </div>

            <h3 className="font-display font-bold text-base mt-6 mb-3">সার্চ</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="প্রোডাক্ট খুঁজুন..."
                className="w-full rounded-xl glass pl-10 pr-3 py-2.5 text-sm bg-card"
              />
            </div>

            <h3 className="font-display font-bold text-base mt-6 mb-3">দাম রেঞ্জ (৳)</h3>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-full rounded-xl glass px-3 py-2 text-sm bg-card"
              />
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-full rounded-xl glass px-3 py-2 text-sm bg-card"
              />
            </div>

            <h3 className="font-display font-bold text-base mt-6 mb-3">বৈশিষ্ট্য</h3>
            <div className="flex flex-wrap gap-2">
              {([
                { k: null, l: "সব" },
                { k: "new", l: "নতুন" },
                { k: "best", l: "বেস্ট সেলিং" },
                { k: "featured", l: "ফিচারড" },
              ] as const).map((b) => (
                <button
                  key={String(b.k)}
                  onClick={() => setBadge(b.k as any)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${badge === b.k ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass hover:bg-accent"}`}
                >
                  {b.l}
                </button>
              ))}
            </div>

            <button
              onClick={resetFilters}
              className="mt-6 w-full rounded-xl glass px-3 py-2 text-xs font-semibold hover:bg-accent inline-flex items-center justify-center gap-1"
            >
              <X className="h-3 w-3" /> ফিল্টার রিসেট
            </button>
          </div>
        </aside>

        {/* Grid */}
        <div>
          {isLoading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-2xl h-72 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              title="এখনো কোনো প্রোডাক্ট নেই"
              hint="অ্যাডমিন প্যানেল থেকে নতুন প্রোডাক্ট যোগ করুন।"
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← হোমে ফিরে যান</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
