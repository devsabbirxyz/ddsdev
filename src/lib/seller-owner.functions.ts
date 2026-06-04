import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Owner-only reads that include financial / sensitive columns.
// Uses the user-scoped supabase client (RLS as user) for orders/products counts,
// and supabaseAdmin for the financial columns (which are revoked from authenticated).

export const getMySellerOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: seller, error } = await supabaseAdmin
      .from("sellers")
      .select("id,user_id,store_name,store_description,store_logo_url,store_cover_url,status,balance,total_earnings,total_withdrawn,commission_rate,created_at,updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!seller) return { seller: null, productCount: 0, orderCount: 0 };
    const [{ count: productCount }, { count: orderCount }] = await Promise.all([
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("seller_id", seller.id),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", seller.id),
    ]);
    return { seller, productCount: productCount ?? 0, orderCount: orderCount ?? 0 };
  });

export const getMySellerBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("sellers")
      .select("id,balance")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const getMySellerProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: seller } = await supabaseAdmin
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (!seller) throw new Error("Seller not found");
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", data.id)
      .eq("seller_id", seller.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return product;
  });
