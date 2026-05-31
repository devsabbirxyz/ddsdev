import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullish(),
  planId: z.string().uuid().nullish(),
  quantity: z.number().int().min(1).max(99),
});

const PlaceOrderSchema = z.object({
  items: z.array(ItemSchema).min(1).max(50),
  customer: z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(255),
    phone: z.string().trim().min(3).max(40),
    input: z.string().trim().max(2000).optional().nullable(),
  }),
  paymentMethodId: z.string().uuid(),
  transactionId: z.string().trim().max(120).optional().nullable(),
  couponCode: z.string().trim().max(60).optional().nullable(),
  redeemPoints: z.number().int().min(0).max(1000000).optional().nullable(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PlaceOrderSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };

    // 1) Load products + variants from DB (authoritative prices)
    const productIds = Array.from(new Set(data.items.map((i) => i.productId)));
    const variantIds = Array.from(
      new Set(data.items.map((i) => i.variantId).filter((v): v is string => !!v)),
    );

    const { data: products, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,title,regular_price,offer_price,is_active,status,seller_id")
      .in("id", productIds);
    if (pErr) throw new Error(pErr.message);

    const productMap = new Map(
      (products ?? [])
        .filter((p) => p.is_active && p.status === "approved")
        .map((p) => [p.id, p]),
    );

    let variantMap = new Map<string, { id: string; product_id: string | null; label: string; regular_price: number; offer_price: number | null }>();
    if (variantIds.length > 0) {
      const { data: variants, error: vErr } = await supabaseAdmin
        .from("product_variants")
        .select("id,product_id,label,regular_price,offer_price,is_active")
        .in("id", variantIds);
      if (vErr) throw new Error(vErr.message);
      variantMap = new Map(
        (variants ?? [])
          .filter((v) => v.is_active)
          .map((v) => [v.id, v as any]),
      );
    }

    // 2) Load payment method
    const { data: pm, error: pmErr } = await supabaseAdmin
      .from("payment_methods")
      .select("id,name,is_manual_active,is_automatic_active,has_automatic")
      .eq("id", data.paymentMethodId)
      .maybeSingle();
    if (pmErr) throw new Error(pmErr.message);
    if (!pm || !(pm.is_manual_active || (pm.has_automatic && pm.is_automatic_active))) {
      throw new Error("Invalid payment method");
    }

    // 3) Build authoritative line items + compute subtotal
    type Line = {
      productId: string;
      variantId: string | null;
      variantLabel: string | null;
      title: string;
      quantity: number;
      unitPrice: number;
      regularPrice: number;
      sellerId: string | null;
    };
    const lines: Line[] = [];
    for (const it of data.items) {
      const p = productMap.get(it.productId);
      if (!p) continue; // skip invalid/inactive
      let unit = Number(p.offer_price ?? p.regular_price ?? 0);
      let regular = Number(p.regular_price ?? unit);
      let variantLabel: string | null = null;
      let vId: string | null = null;
      if (it.variantId) {
        const v = variantMap.get(it.variantId);
        if (!v || v.product_id !== p.id) {
          throw new Error("Invalid variant");
        }
        unit = Number(v.offer_price ?? v.regular_price ?? 0);
        regular = Number(v.regular_price ?? unit);
        variantLabel = v.label;
        vId = v.id;
      }
      if (!Number.isFinite(unit) || unit < 0) throw new Error("Invalid price");
      lines.push({
        productId: p.id,
        variantId: vId,
        variantLabel,
        title: p.title,
        quantity: it.quantity,
        unitPrice: unit,
        regularPrice: regular,
        sellerId: (p as any).seller_id ?? null,
      });
    }
    if (lines.length === 0) throw new Error("No valid items in cart");

    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

    // 4) Validate coupon server-side
    let discount = 0;
    let couponCode: string | null = null;
    let couponId: string | null = null;
    if (data.couponCode) {
      const code = data.couponCode.trim().toUpperCase();
      const { data: coupon, error: cErr } = await supabaseAdmin
        .from("coupons")
        .select("id,code,discount_type,discount_value,minimum_order,is_active,start_date,end_date,max_uses,used_count,max_uses_per_user")
        .ilike("code", code)
        .maybeSingle();
      if (cErr) throw new Error(cErr.message);
      if (!coupon) throw new Error("Coupon not found");
      if (!coupon.is_active) throw new Error("Coupon inactive");
      const now = new Date();
      if (coupon.start_date && new Date(coupon.start_date) > now) throw new Error("Coupon not active yet");
      if (coupon.end_date && new Date(coupon.end_date) < now) throw new Error("Coupon expired");
      if (coupon.max_uses && (coupon.used_count ?? 0) >= coupon.max_uses) throw new Error("Coupon limit reached");
      if (subtotal < Number(coupon.minimum_order ?? 0)) throw new Error("Minimum order not met");

      // Per-user limit
      if (coupon.max_uses_per_user) {
        const { count } = await supabaseAdmin
          .from("coupon_usage")
          .select("id", { count: "exact", head: true })
          .eq("coupon_id", coupon.id)
          .eq("user_id", userId);
        if ((count ?? 0) >= coupon.max_uses_per_user) throw new Error("Coupon per-user limit reached");
      }

      const isPercent = coupon.discount_type === "percentage" || coupon.discount_type === "percent";
      const raw = isPercent
        ? Math.round((subtotal * Number(coupon.discount_value)) / 100)
        : Number(coupon.discount_value);
      discount = Math.max(0, Math.min(raw, subtotal));
      couponCode = coupon.code;
      couponId = coupon.id;
    }

    // 4b) Validate wallet redemption
    let walletRedeem = 0;
    if (data.redeemPoints && data.redeemPoints > 0) {
      const { data: u, error: uErr } = await supabaseAdmin
        .from("users" as any)
        .select("wallet_points")
        .eq("id", userId)
        .maybeSingle();
      if (uErr) throw new Error(uErr.message);
      const balance = Number((u as any)?.wallet_points ?? 0);
      const afterCoupon = Math.max(0, subtotal - discount);
      walletRedeem = Math.min(data.redeemPoints, balance, afterCoupon);
      if (walletRedeem <= 0) walletRedeem = 0;
    }

    // 5) Insert orders (one row per line) with admin client (bypasses RLS but data validated)
    const orderNumber = `DDS-${Date.now().toString(36).toUpperCase()}`;
    const totalDeduction = discount + walletRedeem;
    const perItemDiscount = Math.floor(discount / lines.length);
    const perItemWallet = Math.floor(walletRedeem / lines.length);
    const rows = lines.map((l, idx) => ({
      order_number: idx === 0 ? orderNumber : `${orderNumber}-${idx + 1}`,
      user_id: userId,
      product_id: l.productId,
      variant_id: l.variantId,
      product_title: l.title,
      variant_label: l.variantLabel,
      quantity: l.quantity,
      regular_price: l.regularPrice,
      offer_price: l.unitPrice,
      total_price: Math.max(0, l.unitPrice * l.quantity - perItemDiscount - perItemWallet),
      customer_name: data.customer.name,
      customer_email: data.customer.email,
      customer_phone: data.customer.phone,
      customer_input: data.customer.input || null,
      payment_method: pm.name,
      payment_type: "manual",
      transaction_id: data.transactionId?.trim() || null,
      coupon_code: couponCode,
      discount_amount: perItemDiscount,
      wallet_points_used: idx === 0 ? walletRedeem : 0,
      seller_id: l.sellerId,
      status: "pending",
      delivery_status: "pending",
    }));

    const { data: inserted, error: iErr } = await supabaseAdmin
      .from("orders")
      .insert(rows as any)
      .select("id,order_number");
    if (iErr) throw new Error(iErr.message);

    // 6) Record coupon usage + increment used_count (best effort)
    if (couponId && inserted && inserted[0]) {
      await supabaseAdmin.from("coupon_usage").insert({
        coupon_id: couponId,
        user_id: userId,
        order_id: inserted[0].id,
        discount_amount: discount,
      });
      const { data: cur } = await supabaseAdmin
        .from("coupons")
        .select("used_count")
        .eq("id", couponId)
        .maybeSingle();
      await supabaseAdmin
        .from("coupons")
        .update({ used_count: (cur?.used_count ?? 0) + 1 })
        .eq("id", couponId);
    }

    // 7) Apply wallet redemption (deduct balance + ledger entry)
    if (walletRedeem > 0 && inserted && inserted[0]) {
      const { data: u } = await supabaseAdmin
        .from("users" as any)
        .select("wallet_points")
        .eq("id", userId)
        .maybeSingle();
      const bal = Number((u as any)?.wallet_points ?? 0);
      const newBal = Math.max(0, bal - walletRedeem);
      await supabaseAdmin
        .from("users" as any)
        .update({ wallet_points: newBal } as any)
        .eq("id", userId);
      await supabaseAdmin.from("wallet_transactions" as any).insert({
        user_id: userId,
        points: -walletRedeem,
        type: "redeem",
        order_id: inserted[0].id,
        description: `অর্ডার #${orderNumber} এ ব্যবহার`,
      } as any);
    }

    const totalAmount = rows.reduce((s, r) => s + (r.total_price || 0), 0);

    return {
      ok: true,
      orderNumber,
      orderId: inserted?.[0]?.id ?? null,
      totalAmount,
      itemCount: lines.length,
      firstTitle: lines[0].title,
      paymentMethod: pm.name,
    };
  });
