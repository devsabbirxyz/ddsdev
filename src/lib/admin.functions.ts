import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Admin guard middleware: composes with requireSupabaseAuth
const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Forbidden: admin role required");
    return next({ context: { adminId: userId } });
  });

function genReferralCode(seed: string) {
  const base = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "DDS";
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${base}${rand}`;
}

// ----- Seller approval -----
export const approveSellerApp = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ application_id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: app, error: e1 } = await supabaseAdmin
      .from("seller_applications")
      .select("*")
      .eq("id", data.application_id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!app) throw new Error("Application not found");
    if (!app.user_id) throw new Error("Missing user_id");

    // Upsert seller row
    const { error: e2 } = await supabaseAdmin
      .from("sellers")
      .upsert({
        user_id: app.user_id,
        store_name: app.store_name,
        store_description: app.store_description,
        status: "approved",
      }, { onConflict: "user_id" });
    if (e2) throw new Error(e2.message);

    // Grant role
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: app.user_id, role: "seller" as any })
      .then(() => null, () => null);

    await supabaseAdmin
      .from("seller_applications")
      .update({ status: "approved" })
      .eq("id", app.id);

    await supabaseAdmin.from("notifications").insert({
      user_id: app.user_id,
      type: "seller",
      title: "সেলার আবেদন অনুমোদিত",
      message: "আপনার সেলার আবেদন অনুমোদিত হয়েছে। এখন প্রোডাক্ট যোগ করতে পারবেন।",
      link: "/seller",
    });
    return { ok: true };
  });

export const rejectSellerApp = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({ application_id: z.string().uuid(), reason: z.string().max(500) }).parse(i),
  )
  .handler(async ({ data }) => {
    const { data: app } = await supabaseAdmin
      .from("seller_applications")
      .select("user_id")
      .eq("id", data.application_id)
      .maybeSingle();
    const { error } = await supabaseAdmin
      .from("seller_applications")
      .update({ status: "rejected", rejection_reason: data.reason })
      .eq("id", data.application_id);
    if (error) throw new Error(error.message);
    if (app?.user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: app.user_id,
        type: "seller",
        title: "সেলার আবেদন প্রত্যাখ্যাত",
        message: data.reason,
      });
    }
    return { ok: true };
  });

// ----- Affiliate approval -----
export const approveAffiliateApp = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ application_id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: app, error: e1 } = await supabaseAdmin
      .from("affiliate_applications")
      .select("*")
      .eq("id", data.application_id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!app || !app.user_id) throw new Error("Application not found");

    // Generate unique referral code
    let code = genReferralCode(app.full_name || "DDS");
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabaseAdmin
        .from("affiliates")
        .select("id")
        .eq("referral_code", code)
        .maybeSingle();
      if (!existing) break;
      code = genReferralCode(app.full_name || "DDS");
    }

    const { error: e2 } = await supabaseAdmin
      .from("affiliates")
      .upsert({
        user_id: app.user_id,
        referral_code: code,
        status: "approved",
      }, { onConflict: "user_id" });
    if (e2) throw new Error(e2.message);

    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: app.user_id, role: "affiliate" as any })
      .then(() => null, () => null);

    await supabaseAdmin
      .from("affiliate_applications")
      .update({ status: "approved" })
      .eq("id", app.id);

    await supabaseAdmin.from("notifications").insert({
      user_id: app.user_id,
      type: "affiliate",
      title: "অ্যাফিলিয়েট আবেদন অনুমোদিত",
      message: `আপনার রেফারেল কোড: ${code}`,
      link: "/affiliate",
    });
    return { ok: true, referral_code: code };
  });

export const rejectAffiliateApp = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({ application_id: z.string().uuid(), reason: z.string().max(500) }).parse(i),
  )
  .handler(async ({ data }) => {
    const { data: app } = await supabaseAdmin
      .from("affiliate_applications")
      .select("user_id")
      .eq("id", data.application_id)
      .maybeSingle();
    await supabaseAdmin
      .from("affiliate_applications")
      .update({ status: "rejected", rejection_reason: data.reason })
      .eq("id", data.application_id);
    if (app?.user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: app.user_id,
        type: "affiliate",
        title: "অ্যাফিলিয়েট আবেদন প্রত্যাখ্যাত",
        message: data.reason,
      });
    }
    return { ok: true };
  });

// ----- Product approval -----
export const reviewProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      product_id: z.string().uuid(),
      status: z.enum(["approved", "rejected"]),
      reason: z.string().max(500).optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const update: any = { status: data.status };
    if (data.status === "rejected") update.rejection_reason = data.reason ?? null;
    const { error } = await supabaseAdmin
      .from("products")
      .update(update)
      .eq("id", data.product_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Withdrawals (seller + affiliate) -----
async function processWithdrawal(
  kind: "seller" | "affiliate",
  id: string,
  action: "approved" | "rejected",
  reason?: string,
) {
  const table = kind === "seller" ? "seller_withdrawals" : "affiliate_withdrawals";
  const ownerTable = kind === "seller" ? "sellers" : "affiliates";
  const ownerCol = kind === "seller" ? "seller_id" : "affiliate_id";

  const { data: w, error } = await supabaseAdmin
    .from(table)
    .select(`id,amount,status,${ownerCol}`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!w || (w as any).status !== "pending") throw new Error("Already processed");

  if (action === "approved") {
    const ownerId = (w as any)[ownerCol] as string;
    const { data: owner } = await supabaseAdmin
      .from(ownerTable)
      .select("balance,total_withdrawn,user_id")
      .eq("id", ownerId)
      .maybeSingle();
    if (!owner) throw new Error("Owner not found");
    const bal = Number((owner as any).balance ?? 0);
    const amt = Number((w as any).amount);
    if (bal < amt) throw new Error("Insufficient balance");
    await supabaseAdmin
      .from(ownerTable)
      .update({
        balance: bal - amt,
        total_withdrawn: Number((owner as any).total_withdrawn ?? 0) + amt,
      })
      .eq("id", ownerId);
    await supabaseAdmin
      .from(table)
      .update({ status: "approved", processed_at: new Date().toISOString() })
      .eq("id", id);
    if ((owner as any).user_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: (owner as any).user_id,
        type: "withdrawal",
        title: "উইথড্র অনুমোদিত",
        message: `${amt}৳ পরিশোধ প্রক্রিয়াধীন।`,
      });
    }
  } else {
    await supabaseAdmin
      .from(table)
      .update({ status: "rejected", rejection_reason: reason ?? null, processed_at: new Date().toISOString() })
      .eq("id", id);
  }
  return { ok: true };
}

export const reviewWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      kind: z.enum(["seller", "affiliate"]),
      id: z.string().uuid(),
      action: z.enum(["approved", "rejected"]),
      reason: z.string().max(500).optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => processWithdrawal(data.kind, data.id, data.action, data.reason));

// ----- Categories CRUD -----
function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9\u0980-\u09FF\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 60) || `c-${Date.now()}`;
}

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      name: z.string().min(1).max(100),
      name_en: z.string().max(100).optional().nullable(),
      description: z.string().max(500).optional().nullable(),
      icon_url: z.string().url().optional().nullable(),
      sort_order: z.number().int().min(0).optional(),
      is_active: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const payload: any = {
      name: data.name,
      name_en: data.name_en ?? null,
      description: data.description ?? null,
      icon_url: data.icon_url ?? null,
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("categories").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      payload.slug = `${slugify(data.name)}-${Math.random().toString(36).slice(2, 5)}`;
      const { error } = await supabaseAdmin.from("categories").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Site setting -----
export const saveSetting = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      key: z.string().min(1).max(100),
      value: z.string().max(5000),
      group_name: z.string().max(50).optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { data: existing } = await supabaseAdmin
      .from("site_settings")
      .select("id")
      .eq("key", data.key)
      .maybeSingle();
    if (existing) {
      const { error } = await supabaseAdmin
        .from("site_settings")
        .update({ value: data.value, group_name: data.group_name ?? null })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("site_settings")
        .insert({ key: data.key, value: data.value, group_name: data.group_name ?? null });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ----- Slides (hero + offer + review) -----
export const saveSlide = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      kind: z.enum(["hero", "offer", "review"]),
      id: z.string().uuid().optional(),
      image_url: z.string().url(),
      link_url: z.string().max(500).optional().nullable(),
      alt_text: z.string().max(200).optional().nullable(),
      sort_order: z.number().int().min(0).optional(),
      is_active: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const table =
      data.kind === "hero" ? "hero_slides" :
      data.kind === "offer" ? "offer_slides" : "review_slides";
    const payload: any = {
      image_url: data.image_url,
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    };
    if (data.kind !== "review") {
      payload.link_url = data.link_url ?? null;
      payload.alt_text = data.alt_text ?? null;
    }
    if (data.id) {
      const { error } = await supabaseAdmin.from(table).update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from(table).insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteSlide = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({ kind: z.enum(["hero", "offer", "review"]), id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data }) => {
    const table =
      data.kind === "hero" ? "hero_slides" :
      data.kind === "offer" ? "offer_slides" : "review_slides";
    const { error } = await supabaseAdmin.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Bulk settings save -----
export const saveSettingsBulk = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      items: z.array(z.object({
        key: z.string().min(1).max(100),
        value: z.string().max(20000),
        group_name: z.string().max(50).optional(),
      })).min(1).max(50),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    for (const it of data.items) {
      const { data: existing } = await supabaseAdmin
        .from("site_settings").select("id").eq("key", it.key).maybeSingle();
      if (existing) {
        const { error } = await supabaseAdmin.from("site_settings")
          .update({ value: it.value, group_name: it.group_name ?? null }).eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabaseAdmin.from("site_settings")
          .insert({ key: it.key, value: it.value, group_name: it.group_name ?? null });
        if (error) throw new Error(error.message);
      }
    }
    return { ok: true };
  });

// ----- Products CRUD -----
const DELIVERY_TYPES = ["instant_text", "account", "invite_link", "subscription", "manual"] as const;

export const getProductFull = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { data: product, error } = await supabaseAdmin
      .from("products").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!product) throw new Error("Not found");
    const [{ data: images }, { data: variants }, { data: accounts }] = await Promise.all([
      supabaseAdmin.from("product_images").select("*").eq("product_id", data.id).order("sort_order"),
      supabaseAdmin.from("product_variants").select("*").eq("product_id", data.id).order("sort_order"),
      supabaseAdmin.from("product_accounts").select("id,username,is_sold,created_at,variant_id,extra_info")
        .eq("product_id", data.id).order("created_at", { ascending: false }).limit(200),
    ]);
    return { product, images: images ?? [], variants: variants ?? [], accounts: accounts ?? [] };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(200),
      title_en: z.string().max(200).optional().nullable(),
      slug: z.string().max(200).optional().nullable(),
      category_id: z.string().uuid().optional().nullable(),
      short_description: z.string().max(500).optional().nullable(),
      short_description_en: z.string().max(500).optional().nullable(),
      long_description: z.string().max(20000).optional().nullable(),
      long_description_en: z.string().max(20000).optional().nullable(),
      regular_price: z.number().min(0).optional().nullable(),
      offer_price: z.number().min(0).optional().nullable(),
      delivery_type: z.enum(DELIVERY_TYPES),
      delivery_content: z.string().max(20000).optional().nullable(),
      subscription_input_label: z.string().max(200).optional().nullable(),
      subscription_input_label_en: z.string().max(200).optional().nullable(),
      video_url: z.string().max(500).optional().nullable(),
      seo_title: z.string().max(200).optional().nullable(),
      seo_description: z.string().max(500).optional().nullable(),
      is_variant: z.boolean().optional(),
      is_active: z.boolean().optional(),
      is_featured: z.boolean().optional(),
      is_new_arrival: z.boolean().optional(),
      is_best_seller: z.boolean().optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const payload: any = {
      title: data.title,
      title_en: data.title_en ?? null,
      category_id: data.category_id ?? null,
      short_description: data.short_description ?? null,
      short_description_en: data.short_description_en ?? null,
      long_description: data.long_description ?? null,
      long_description_en: data.long_description_en ?? null,
      regular_price: data.regular_price ?? null,
      offer_price: data.offer_price ?? null,
      delivery_type: data.delivery_type,
      delivery_content: data.delivery_content ?? null,
      subscription_input_label: data.subscription_input_label ?? null,
      subscription_input_label_en: data.subscription_input_label_en ?? null,
      video_url: data.video_url ?? null,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      is_variant: data.is_variant ?? false,
      is_active: data.is_active ?? true,
      is_featured: data.is_featured ?? false,
      is_new_arrival: data.is_new_arrival ?? false,
      is_best_seller: data.is_best_seller ?? false,
      status: data.status ?? "approved",
    };
    if (data.id) {
      if (data.slug) payload.slug = data.slug;
      const { error } = await supabaseAdmin.from("products").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    } else {
      payload.slug = data.slug || `${slugify(data.title)}-${Math.random().toString(36).slice(2, 6)}`;
      const { data: ins, error } = await supabaseAdmin.from("products").insert(payload).select("id").single();
      if (error) throw new Error(error.message);
      return { ok: true, id: ins!.id };
    }
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("product_images").delete().eq("product_id", data.id);
    await supabaseAdmin.from("product_variants").delete().eq("product_id", data.id);
    await supabaseAdmin.from("product_accounts").delete().eq("product_id", data.id);
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveProductImage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      product_id: z.string().uuid(),
      image_url: z.string().url(),
      is_main: z.boolean().optional(),
      sort_order: z.number().int().min(0).optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    if (data.is_main) {
      await supabaseAdmin.from("product_images").update({ is_main: false }).eq("product_id", data.product_id);
    }
    const { error } = await supabaseAdmin.from("product_images").insert({
      product_id: data.product_id,
      image_url: data.image_url,
      is_main: data.is_main ?? false,
      sort_order: data.sort_order ?? 0,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProductImage = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("product_images").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveVariant = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      product_id: z.string().uuid(),
      label: z.string().min(1).max(100),
      label_en: z.string().max(100).optional().nullable(),
      regular_price: z.number().min(0),
      offer_price: z.number().min(0).optional().nullable(),
      sort_order: z.number().int().min(0).optional(),
      is_active: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const payload: any = {
      product_id: data.product_id,
      label: data.label,
      label_en: data.label_en ?? null,
      regular_price: data.regular_price,
      offer_price: data.offer_price ?? null,
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("product_variants").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("product_variants").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteVariant = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("product_variants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addProductAccounts = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      product_id: z.string().uuid(),
      variant_id: z.string().uuid().optional().nullable(),
      accounts: z.array(z.object({
        username: z.string().max(500).optional().nullable(),
        password: z.string().max(500).optional().nullable(),
        extra_info: z.string().max(2000).optional().nullable(),
      })).min(1).max(500),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const rows = data.accounts.map((a) => ({
      product_id: data.product_id,
      variant_id: data.variant_id ?? null,
      username: a.username ?? null,
      password: a.password ?? null,
      extra_info: a.extra_info ?? null,
    }));
    const { error } = await supabaseAdmin.from("product_accounts").insert(rows);
    if (error) throw new Error(error.message);
    return { ok: true, count: rows.length };
  });

export const deleteProductAccount = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("product_accounts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });



// ----- Payment methods -----
export const savePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional().nullable(),
      name: z.string().min(1).max(100),
      name_en: z.string().max(100).optional().nullable(),
      account_type: z.string().max(50).optional().nullable(),
      send_type: z.string().max(50).optional().nullable(),
      account_number: z.string().max(200).optional().nullable(),
      instructions: z.string().max(2000).optional().nullable(),
      instructions_en: z.string().max(2000).optional().nullable(),
      api_key: z.string().max(500).optional().nullable(),
      has_automatic: z.boolean().optional(),
      is_manual_active: z.boolean().optional(),
      is_automatic_active: z.boolean().optional(),
      sort_order: z.number().int().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin.from("payment_methods").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: ins, error } = await supabaseAdmin.from("payment_methods").insert(rest).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: ins.id };
  });

export const deletePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("payment_methods").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
