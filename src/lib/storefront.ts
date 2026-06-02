// Client-side data queries for public storefront — uses Supabase RLS-allowed reads.
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const productsQuery = (opts?: {
  category?: string | null;
  search?: string | null;
  sort?: "new" | "best" | "price_asc" | "price_desc";
  featured?: boolean;
  limit?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  badge?: "new" | "best" | "featured" | null;
}) =>
  queryOptions({
    queryKey: ["products", opts ?? {}],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("id,slug,title,title_en,short_description,short_description_en,regular_price,offer_price,average_rating,total_sales,total_reviews,is_featured,is_new_arrival,is_best_seller,is_variant,view_count,category_id,created_at,track_stock,stock_quantity,sellers(store_name,store_logo_url),product_images(image_url,is_main,sort_order),product_variants(regular_price,offer_price,is_active,stock_quantity)")
        .eq("is_active", true)
        .eq("status", "approved");

      if (opts?.featured) q = q.eq("is_featured", true);
      if (opts?.badge === "new") q = q.eq("is_new_arrival", true);
      if (opts?.badge === "best") q = q.eq("is_best_seller", true);
      if (opts?.badge === "featured") q = q.eq("is_featured", true);
      if (opts?.category) {
        const { data: cat } = await supabase.from("categories").select("id").eq("slug", opts.category).maybeSingle();
        if (cat) q = q.eq("category_id", cat.id);
      }
      if (opts?.search) q = q.ilike("title", `%${opts.search}%`);
      if (typeof opts?.minPrice === "number") q = q.gte("offer_price", opts.minPrice);
      if (typeof opts?.maxPrice === "number") q = q.lte("offer_price", opts.maxPrice);

      switch (opts?.sort) {
        case "best": q = q.order("total_sales", { ascending: false }); break;
        case "price_asc": q = q.order("offer_price", { ascending: true, nullsFirst: false }); break;
        case "price_desc": q = q.order("offer_price", { ascending: false, nullsFirst: false }); break;
      default:
        q = q.order("is_featured", { ascending: false });
        q = q.order("is_best_seller", { ascending: false });
        q = q.order("created_at", { ascending: false });
        break;
      }
      if (opts?.limit) q = q.limit(opts.limit);

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,slug,name,name_en,icon_url,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(id,image_url,sort_order), product_variants(id,label,label_en,regular_price,offer_price,is_active,sort_order), subscription_plans(id,name,name_en,price,duration_days,is_active,sort_order)")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const productReviewsQuery = (productId: string | undefined) =>
  queryOptions({
    queryKey: ["reviews", productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("id,rating,review_text,created_at,user_id")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

export const productQuestionsQuery = (productId: string | undefined) =>
  queryOptions({
    queryKey: ["product_questions", productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("product_questions" as any)
        .select("id,user_name,question,answer,answered_at,created_at,user_id")
        .eq("product_id", productId)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) return [];
      return (data ?? []) as any[];
    },
  });

export const blogPostsQuery = (limit?: number, opts?: { featured?: boolean }) =>
  queryOptions({
    queryKey: ["blog", limit ?? null, opts ?? {}],
    queryFn: async () => {
      let q = supabase
        .from("blog_posts")
        .select("id,slug,title,title_en,short_description,short_description_en,thumbnail_url,published_at,view_count,is_featured")
        .eq("is_published", true)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (opts?.featured) q = q.eq("is_featured", true);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });


export const blogPostBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const faqsQuery = () =>
  queryOptions({
    queryKey: ["faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id,question,question_en,answer,answer_en,sort_order,category_id, faq_categories(name,name_en)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const reviewSlidesQuery = () =>
  queryOptions({
    queryKey: ["review_slides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_slides")
        .select("id,image_url,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(12);
      if (error) return [];
      return data ?? [];
    },
  });


export const pageBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("title,title_en,content,content_en,seo_title,seo_description")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export function formatBDT(n: number | null | undefined) {
  if (n == null) return "৳০";
  return "৳" + new Intl.NumberFormat("en-IN").format(Math.round(Number(n)));
}
