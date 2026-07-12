import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";

type Hit = {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  offer_price: number | null;
  regular_price: number | null;
  category_name: string | null;
  image_url: string | null;
};

const instantSearchIndexQuery = {
  queryKey: ["instant-search-index"],
  staleTime: 60_000,
  queryFn: async (): Promise<Hit[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("id,slug,title,title_en,offer_price,regular_price,categories(name),product_images(image_url,sort_order,is_main)")
      .eq("is_active", true)
      .eq("status", "approved")
      .order("total_sales", { ascending: false })
      .limit(300);
    if (error) throw error;
    return (data ?? []).map((p: any) => {
      const imgs = (p.product_images ?? []).slice().sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        title_en: p.title_en,
        offer_price: p.offer_price,
        regular_price: p.regular_price,
        category_name: p.categories?.name ?? null,
        image_url: imgs[0]?.image_url ?? null,
      };
    });
  },
};

// Simple typo-tolerant scorer
function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const dp: number[] = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) dp[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    let best = dp[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      if (dp[j] < best) best = dp[j];
      prev = tmp;
    }
    if (best > max) return max + 1;
  }
  return dp[b.length];
}
function scoreHit(hit: Hit, q: string): number {
  const query = normalize(q);
  if (!query) return 0;
  const hay = normalize(`${hit.title} ${hit.title_en ?? ""} ${hit.category_name ?? ""}`);
  if (hay.startsWith(query)) return 100;
  if (hay.includes(query)) return 80;
  // token-level
  const tokens = hay.split(/[\s\-_/]+/);
  let best = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (t.startsWith(query)) best = Math.max(best, 70);
    else if (t.includes(query)) best = Math.max(best, 55);
    else {
      const d = editDistance(t, query, 2);
      if (d === 0) best = Math.max(best, 100);
      else if (d === 1) best = Math.max(best, 45);
      else if (d === 2 && query.length >= 4) best = Math.max(best, 25);
    }
  }
  return best;
}

export function InstantSearch({ className = "", placeholder = "প্রোডাক্ট সার্চ করুন..." }: { className?: string; placeholder?: string }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: hits = [], isLoading } = useQuery(instantSearchIndexQuery);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    return hits
      .map((h) => ({ h, s: scoreHit(h, q) }))
      .filter((r) => r.s > 20)
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((r) => r.h);
  }, [q, hits]);

  const gotoAll = () => {
    setOpen(false);
    navigate({ to: "/shop", search: {} });
  };

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActiveIdx(0); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(results.length - 1, i + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); }
            else if (e.key === "Enter" && results[activeIdx]) {
              setOpen(false);
              navigate({ to: "/product/$slug", params: { slug: results[activeIdx].slug } });
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl glass pl-9 pr-9 py-2 text-sm bg-card"
        />
        {q && (
          <button
            onClick={() => { setQ(""); setOpen(false); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 hover:bg-accent"
            aria-label="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && q.trim().length > 0 && (
        <div className="absolute left-0 right-0 mt-2 max-h-[70vh] overflow-auto rounded-2xl glass-card border border-border shadow-2xl z-50">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> সার্চ ইনডেক্স লোড হচ্ছে...
            </div>
          ) : results.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <div>"{q}" এর জন্য কিছু পাওয়া যায়নি</div>
              <button onClick={gotoAll} className="mt-3 text-xs font-semibold text-primary hover:underline">
                সব প্রোডাক্ট দেখুন →
              </button>
            </div>
          ) : (
            <ul className="p-2">
              {results.map((h, i) => (
                <li key={h.id}>
                  <Link
                    to="/product/$slug"
                    params={{ slug: h.slug }}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-2 py-2 transition ${
                      i === activeIdx ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted grid place-items-center shrink-0">
                      {h.image_url ? (
                        <img src={h.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground">{h.title.slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{h.title}</div>
                      {h.category_name && (
                        <div className="text-[10px] text-muted-foreground truncate">{h.category_name}</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-gradient-brand">
                        {formatBDT(Number(h.offer_price ?? h.regular_price ?? 0))}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              <li className="border-t border-border/50 mt-1">
                <button onClick={gotoAll} className="w-full text-center text-xs font-semibold text-primary py-2 hover:bg-accent rounded-xl">
                  সব প্রোডাক্ট ব্রাউজ করুন →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
