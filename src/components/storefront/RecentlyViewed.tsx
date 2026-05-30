import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, X } from "lucide-react";
import { ProductCard, type ProductCardData } from "./ProductCard";
import { getRecentlyViewedIds, recentlyViewedProductsQuery } from "@/lib/recently-viewed";

export function RecentlyViewed({ excludeId, limit = 8 }: { excludeId?: string; limit?: number }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setIds(getRecentlyViewedIds());
    refresh();
    window.addEventListener("dds-recently-viewed-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("dds-recently-viewed-changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const filtered = ids.filter((id) => id !== excludeId).slice(0, limit);
  const { data: products = [] } = useQuery(recentlyViewedProductsQuery(filtered));

  if (products.length === 0) return null;

  const clearAll = () => {
    try {
      localStorage.removeItem("dds_recently_viewed");
      window.dispatchEvent(new Event("dds-recently-viewed-changed"));
    } catch {
      // ignore
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold text-xl sm:text-2xl">সম্প্রতি দেখা প্রোডাক্ট</h2>
        </div>
        <button
          onClick={clearAll}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <X className="h-3 w-3" /> মুছুন
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} p={p as ProductCardData} />
        ))}
      </div>
    </section>
  );
}
