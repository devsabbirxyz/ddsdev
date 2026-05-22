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

// ----- Slides (hero + offer) -----
export const saveSlide = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      kind: z.enum(["hero", "offer"]),
      id: z.string().uuid().optional(),
      image_url: z.string().url(),
      link_url: z.string().max(500).optional().nullable(),
      alt_text: z.string().max(200).optional().nullable(),
      sort_order: z.number().int().min(0).optional(),
      is_active: z.boolean().optional(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const table = data.kind === "hero" ? "hero_slides" : "offer_slides";
    const payload: any = {
      image_url: data.image_url,
      link_url: data.link_url ?? null,
      alt_text: data.alt_text ?? null,
      sort_order: data.sort_order ?? 0,
      is_active: data.is_active ?? true,
    };
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
    z.object({ kind: z.enum(["hero", "offer"]), id: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data }) => {
    const table = data.kind === "hero" ? "hero_slides" : "offer_slides";
    const { error } = await supabaseAdmin.from(table).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
