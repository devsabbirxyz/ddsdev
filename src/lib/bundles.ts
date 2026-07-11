import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Bundle = {
  id: string;
  title: string;
  title_en: string | null;
  description: string | null;
  discount_percent: number;
  is_active: boolean;
  sort_order: number;
  image_url: string | null;
  items: Array<{
    id: string;
    product_id: string;
    sort_order: number;
    product: {
      id: string;
      title: string;
      slug: string;
      regular_price: number | null;
      offer_price: number | null;
      product_images: Array<{ image_url: string }> | null;
    } | null;
  }>;
};

export const bundlesQuery = () =>
  queryOptions({
    queryKey: ["bundles", "active"],
    staleTime: 60_000,
    queryFn: async (): Promise<Bundle[]> => {
      const { data, error } = await (supabase as any)
        .from("bundles")
        .select(`
          id,title,title_en,description,discount_percent,is_active,sort_order,image_url,
          items:bundle_items(
            id,product_id,sort_order,
            product:products(id,title,slug,regular_price,offer_price,product_images(image_url))
          )
        `)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Bundle[];
    },
  });

// ---------- Admin ----------
export const listBundles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await supabase
      .from("bundles")
      .select(`
        *,
        items:bundle_items(
          id,product_id,sort_order,
          product:products(id,title)
        )
      `)
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return { bundles: data ?? [] };
  });

export const saveBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(200),
      title_en: z.string().max(200).nullish(),
      description: z.string().max(2000).nullish(),
      discount_percent: z.number().min(0).max(100),
      is_active: z.boolean(),
      sort_order: z.number().int(),
      image_url: z.string().nullish(),
      product_ids: z.array(z.string().uuid()).min(2).max(10),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");

    let bundleId = data.id;
    const payload = {
      title: data.title,
      title_en: data.title_en ?? null,
      description: data.description ?? null,
      discount_percent: data.discount_percent,
      is_active: data.is_active,
      sort_order: data.sort_order,
      image_url: data.image_url ?? null,
    };

    if (bundleId) {
      const { error } = await supabase.from("bundles").update(payload).eq("id", bundleId);
      if (error) throw new Error(error.message);
    } else {
      const { data: ins, error } = await supabase.from("bundles").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      bundleId = ins.id;
    }

    // Replace items
    await supabase.from("bundle_items").delete().eq("bundle_id", bundleId);
    const rows = data.product_ids.map((pid, idx) => ({
      bundle_id: bundleId,
      product_id: pid,
      sort_order: idx,
    }));
    const { error: itErr } = await supabase.from("bundle_items").insert(rows);
    if (itErr) throw new Error(itErr.message);

    return { ok: true, id: bundleId };
  });

export const deleteBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await supabase.from("bundles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
