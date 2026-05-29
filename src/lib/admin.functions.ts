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
      .select("role,is_active")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin", "moderator"])
      .eq("is_active", true)
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
      offer_price: z.preprocess(
        (value) => typeof value === "number" && value < 0 ? null : value,
        z.number().min(0).optional().nullable(),
      ),
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

export const toggleProductFlag = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      flag: z.enum(["is_featured", "is_best_seller", "is_new_arrival", "is_active"]),
      value: z.boolean(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    if (data.flag === "is_featured" && data.value) {
      const { count, error: cErr } = await supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_featured", true);
      if (cErr) throw new Error(cErr.message);
      if ((count ?? 0) >= 12) {
        throw new Error("সর্বোচ্চ ১২টা Featured প্রোডাক্ট নির্বাচন করা হয়েছে!");
      }
    }
    const { error } = await supabaseAdmin
      .from("products")
      .update({ [data.flag]: data.value } as any)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, flag: data.flag, value: data.value };
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
export const listPaymentMethodsAdmin = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data, error } = await supabaseAdmin
      .from("payment_methods")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

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

// ----- Coupons -----
export const saveCoupon = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional().nullable(),
      code: z.string().min(2).max(50).regex(/^[A-Za-z0-9_-]+$/),
      discount_type: z.enum(["percentage", "fixed"]),
      discount_value: z.number().min(0),
      minimum_order: z.number().min(0).optional(),
      max_uses: z.number().int().min(0).optional().nullable(),
      max_uses_per_user: z.number().int().min(1).optional(),
      applies_to: z.enum(["all", "categories", "products"]).optional(),
      start_date: z.string().optional().nullable(),
      end_date: z.string().optional().nullable(),
      is_active: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { id, ...rest } = data;
    const payload = {
      ...rest,
      code: rest.code.toUpperCase(),
      max_uses: rest.max_uses ?? null,
      start_date: rest.start_date || null,
      end_date: rest.end_date || null,
    };
    if (id) {
      const { error } = await supabaseAdmin.from("coupons").update(payload).eq("id", id);
      if (error) throw new Error(error.message);
      return { ok: true, id };
    }
    const { data: ins, error } = await supabaseAdmin.from("coupons").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: ins.id };
  });

export const deleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ OFFERS (special offers cards) ============
export const listOffers = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { data, error } = await supabaseAdmin.from("offers").select("*").order("sort_order");
    if (error) throw new Error(error.message);
    return { offers: data ?? [] };
  });

export const saveOffer = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().min(1).max(200),
      title_en: z.string().max(200).optional().nullable(),
      image_url: z.string().url().max(1000),
      link_url: z.string().max(500).optional().nullable(),
      is_active: z.boolean().optional(),
      sort_order: z.number().int().min(0).optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const payload = {
      title: data.title,
      title_en: data.title_en ?? null,
      image_url: data.image_url,
      link_url: data.link_url ?? null,
      is_active: data.is_active ?? true,
      sort_order: data.sort_order ?? 0,
    };
    if (data.id) {
      const { error } = await supabaseAdmin.from("offers").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { ok: true, id: data.id };
    }
    const { data: ins, error } = await supabaseAdmin.from("offers").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { ok: true, id: ins!.id };
  });

export const deleteOffer = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("offers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ ADMIN MANAGEMENT (super_admin gated) ============
const requireSuperAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role,is_active")
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Forbidden: super_admin required");
    return next({ context: { adminId: userId } });
  });

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSuperAdmin])
  .handler(async () => {
    const { data: roles, error } = await supabaseAdmin
      .from("user_roles")
      .select("id,user_id,role,is_active,created_at")
      .in("role", ["admin", "super_admin", "moderator"])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const userIds = Array.from(new Set((roles ?? []).map((r) => r.user_id).filter(Boolean))) as string[];
    let usersMap: Record<string, { email: string; full_name: string | null }> = {};
    if (userIds.length) {
      const { data: us } = await supabaseAdmin.from("users").select("id,email,full_name").in("id", userIds);
      for (const u of us ?? []) usersMap[u.id] = { email: u.email ?? "", full_name: u.full_name };
    }
    return {
      admins: (roles ?? []).map((r) => ({
        ...r,
        email: usersMap[r.user_id ?? ""]?.email ?? "",
        full_name: usersMap[r.user_id ?? ""]?.full_name ?? null,
      })),
    };
  });

export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(8).max(100),
      full_name: z.string().min(1).max(100),
      role: z.enum(["admin", "super_admin", "moderator"]),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const { data: created, error: e1 } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (e1) throw new Error(e1.message);
    const uid = created.user!.id;
    // user record is created by handle_new_user trigger; ensure role row
    const { error: e2 } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: uid, role: data.role as any, is_active: true });
    if (e2) throw new Error(e2.message);
    return { ok: true, user_id: uid };
  });

export const updateAdmin = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      role_id: z.string().uuid(),
      role: z.enum(["admin", "super_admin", "moderator"]).optional(),
      is_active: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const patch: any = {};
    if (data.role) patch.role = data.role;
    if (typeof data.is_active === "boolean") patch.is_active = data.is_active;

    if (data.role) {
      const { data: current } = await supabaseAdmin
        .from("user_roles").select("user_id, role").eq("id", data.role_id).maybeSingle();
      if (!current) throw new Error("Role not found");
      if (current.role !== data.role) {
        const { data: dup } = await supabaseAdmin
          .from("user_roles").select("id")
          .eq("user_id", current.user_id).eq("role", data.role).maybeSingle();
        if (dup) await supabaseAdmin.from("user_roles").delete().eq("id", dup.id);
      }
    }

    const { error } = await supabaseAdmin.from("user_roles").update(patch).eq("id", data.role_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .middleware([requireSuperAdmin])
  .inputValidator((i: unknown) => z.object({ role_id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("user_roles").delete().eq("id", data.role_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ DASHBOARD STATS (admin) ============
export const getOverviewStats = createServerFn({ method: "GET" })
  .middleware([requireAdmin])
  .handler(async () => {
    const now = new Date();
    const start30 = new Date(now);
    start30.setDate(start30.getDate() - 29);
    start30.setHours(0, 0, 0, 0);

    const [ordersAll, ordersRange, sellers, affiliates, products, users, pendingOrders, pendingSellers, pendingAffiliates, pendingProducts, pendingWS, pendingWA] = await Promise.all([
      supabaseAdmin.from("orders").select("total_price,status"),
      supabaseAdmin.from("orders").select("created_at,total_price,status,delivery_type:payment_method").gte("created_at", start30.toISOString()),
      supabaseAdmin.from("sellers").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabaseAdmin.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabaseAdmin.from("users").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("seller_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("affiliate_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("products").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("seller_withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabaseAdmin.from("affiliate_withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    const revenue = (ordersAll.data ?? [])
      .filter((o: any) => o.status === "approved")
      .reduce((s: number, o: any) => s + Number(o.total_price ?? 0), 0);

    // Build 30-day buckets
    const byDay: Record<string, { date: string; orders: number; revenue: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(start30);
      d.setDate(start30.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      byDay[key] = { date: key, orders: 0, revenue: 0 };
    }
    for (const o of ordersRange.data ?? []) {
      const key = (o.created_at as string).slice(0, 10);
      if (byDay[key]) {
        byDay[key].orders += 1;
        if ((o as any).status === "approved") byDay[key].revenue += Number((o as any).total_price ?? 0);
      }
    }

    // Top products
    const { data: top } = await supabaseAdmin
      .from("products")
      .select("title,total_sales,view_count")
      .order("total_sales", { ascending: false })
      .limit(5);

    return {
      kpis: {
        revenue,
        orderCount: ordersAll.data?.length ?? 0,
        sellerCount: sellers.count ?? 0,
        affiliateCount: affiliates.count ?? 0,
        productCount: products.count ?? 0,
        userCount: users.count ?? 0,
      },
      pending: {
        orders: pendingOrders.count ?? 0,
        sellers: pendingSellers.count ?? 0,
        affiliates: pendingAffiliates.count ?? 0,
        products: pendingProducts.count ?? 0,
        withdrawals: (pendingWS.count ?? 0) + (pendingWA.count ?? 0),
      },
      series: Object.values(byDay),
      topProducts: top ?? [],
    };
  });

