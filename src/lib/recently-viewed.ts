// Client-only recently viewed products (localStorage-based, works for guests).
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KEY = "dds_recently_viewed";
const MAX = 20;

export function getRecentlyViewedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(productId: string) {
  if (typeof window === "undefined" || !productId) return;
  try {
    const cur = getRecentlyViewedIds().filter((id) => id !== productId);
    cur.unshift(productId);
    localStorage.setItem(KEY, JSON.stringify(cur.slice(0, MAX)));
    window.dispatchEvent(new Event("dds-recently-viewed-changed"));
  } catch {
    // ignore
  }
}

export const recentlyViewedProductsQuery = (ids: string[]) =>
  queryOptions({
    queryKey: ["recently-viewed-products", ids],
    enabled: ids.length > 0,
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from("products")
        .select("id,slug,title,title_en,short_description,regular_price,offer_price,average_rating,total_reviews,is_featured,is_new_arrival,is_best_seller,is_variant,view_count,sellers(store_name,store_logo_url),product_images(image_url,is_main,sort_order),product_variants(regular_price,offer_price,is_active)")
        .in("id", ids)
        .eq("is_active", true)
        .eq("status", "approved");
      if (error) throw error;
      // preserve original ID order (most recent first)
      const map = new Map((data ?? []).map((p) => [p.id, p]));
      return ids.map((id) => map.get(id)).filter(Boolean) as NonNullable<ReturnType<typeof map.get>>[];
    },
  });
