import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || `p-${Date.now()}`;
}

async function getSeller(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("sellers")
    .select("id,status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Seller account not found");
  if (data.status !== "approved") throw new Error("Seller account not approved");
  return data;
}

// ---- Apply ----
export const applySeller = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      store_name: z.string().min(2).max(100),
      store_description: z.string().max(1000).optional(),
      phone: z.string().min(5).max(30),
      email: z.string().email(),
      product_types: z.string().max(500).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("seller_applications").insert({
      user_id: userId,
      store_name: data.store_name,
      store_description: data.store_description ?? null,
      phone: data.phone,
      email: data.email,
      product_types: data.product_types ?? null,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Create / Update product ----
const productInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(2).max(200),
  title_en: z.string().max(200).optional().nullable(),
  slug: z.string().max(200).optional().nullable(),
  short_description: z.string().max(500).optional().nullable(),
  long_description: z.string().max(5000).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  regular_price: z.number().min(0),
  offer_price: z.number().min(0).optional().nullable(),
  delivery_type: z.enum(["account", "subscription", "downloadable", "method", "text_link"]),
  delivery_content: z.string().max(10000).optional().nullable(),
  is_variant: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => productInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const seller = await getSeller(supabase, userId);

    const payload = {
      seller_id: seller.id,
      title: data.title,
      title_en: data.title_en ?? null,
      short_description: data.short_description ?? null,
      long_description: data.long_description ?? null,
      category_id: data.category_id ?? null,
      regular_price: data.regular_price,
      offer_price: data.offer_price ?? null,
      delivery_type: data.delivery_type,
      delivery_content: data.delivery_content ?? null,
      is_variant: data.is_variant ?? false,
      is_active: data.is_active ?? true,
      status: "pending" as const,
    };

    if (data.id) {
      const updatePayload: any = { ...payload };
      if (data.slug) updatePayload.slug = data.slug;
      const { data: updated, error } = await supabase
        .from("products")
        .update(updatePayload)
        .eq("id", data.id)
        .eq("seller_id", seller.id)
        .select("id,slug")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return { ok: true, id: updated?.id };
    } else {
      const slug = `${slugify(data.title)}-${Math.random().toString(36).slice(2, 7)}`;
      const { data: inserted, error } = await supabase
        .from("products")
        .insert({ ...payload, slug })
        .select("id,slug")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, id: inserted.id };
    }
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const seller = await getSeller(supabase, userId);
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", data.id)
      .eq("seller_id", seller.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Store profile ----
export const updateStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      store_name: z.string().min(2).max(100),
      store_description: z.string().max(1000).optional().nullable(),
      store_logo_url: z.string().url().optional().nullable(),
      store_cover_url: z.string().url().optional().nullable(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await getSeller(supabase, userId);
    const { error } = await supabase
      .from("sellers")
      .update({
        store_name: data.store_name,
        store_description: data.store_description ?? null,
        store_logo_url: data.store_logo_url ?? null,
        store_cover_url: data.store_cover_url ?? null,
      })
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Withdrawal request ----
export const requestSellerWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      amount: z.number().min(100),
      payment_method: z.string().min(2).max(50),
      account_number: z.string().min(3).max(50),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const seller = await getSeller(supabase, userId);
    const { data: s } = await supabase
      .from("sellers")
      .select("balance")
      .eq("id", seller.id)
      .maybeSingle();
    if (!s || Number(s.balance ?? 0) < data.amount) {
      throw new Error("Insufficient balance");
    }
    const { error } = await supabase.from("seller_withdrawals").insert({
      seller_id: seller.id,
      amount: data.amount,
      payment_method: data.payment_method,
      account_number: data.account_number,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
