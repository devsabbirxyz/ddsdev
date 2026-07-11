import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ---------- Helpers ----------
async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

function buildAccountContent(acc: {
  username: string | null;
  password: string | null;
  extra_info: string | null;
}) {
  const parts: string[] = [];
  if (acc.username) parts.push(`Username/Email: ${acc.username}`);
  if (acc.password) parts.push(`Password: ${acc.password}`);
  if (acc.extra_info) parts.push(`\n${acc.extra_info}`);
  return parts.join("\n");
}

async function notifyUser(
  userId: string,
  title: string,
  message: string,
  link: string,
  type: string,
) {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    link,
  });
  // Also fire a browser push (best-effort; ignore failures)
  try {
    const { sendPushToUser } = await import("@/lib/push.server");
    await sendPushToUser(userId, { title, body: message, url: link, tag: type }, { eventType: type });
  } catch (e) {
    console.error("[push] delivery notify failed", e);
  }
}

// ---------- Deliver ----------
export const deliverOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    // Load order
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .maybeSingle();
    if (oErr) throw new Error(oErr.message);
    if (!order) throw new Error("Order not found");
    if (order.status === "approved" && order.delivery_status === "delivered") {
      return { ok: true, alreadyDelivered: true };
    }

    // Load product
    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,title,delivery_type,delivery_content")
      .eq("id", order.product_id!)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product) throw new Error("Product not found");

    let deliveryContent = product.delivery_content ?? "";

    // Handle each delivery type
    switch (product.delivery_type) {
      case "account": {
        const claimed: string[] = [];
        for (let i = 0; i < (order.quantity ?? 1); i++) {
          let q = supabaseAdmin
            .from("product_accounts")
            .select("id,username,password,extra_info")
            .eq("product_id", product.id)
            .eq("is_sold", false);
          if (order.variant_id) q = q.eq("variant_id", order.variant_id);
          const { data: acc, error: aErr } = await q.limit(1).maybeSingle();
          if (aErr) throw new Error(aErr.message);
          if (!acc) throw new Error("No account stock available for this product/variant");

          const { error: uErr } = await supabaseAdmin
            .from("product_accounts")
            .update({
              is_sold: true,
              sold_at: new Date().toISOString(),
              order_id: order.id,
            })
            .eq("id", acc.id)
            .eq("is_sold", false);
          if (uErr) throw new Error(uErr.message);
          claimed.push(buildAccountContent(acc));
        }
        deliveryContent = claimed.join("\n\n---\n\n");
        break;
      }
      case "subscription":
      case "downloadable":
      case "method":
      case "text_link":
      default:
        // Use product.delivery_content as-is
        if (!deliveryContent) {
          deliveryContent = "ডেলিভারি সম্পন্ন হয়েছে। বিস্তারিত জানতে support এ যোগাযোগ করুন।";
        }
        break;
    }

    // Update order
    const { error: updErr } = await supabaseAdmin
      .from("orders")
      .update({
        status: "approved",
        delivery_status: "delivered",
        delivery_content: deliveryContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    if (updErr) throw new Error(updErr.message);

    // Increment product total_sales
    const { data: pCur } = await supabaseAdmin
      .from("products")
      .select("total_sales")
      .eq("id", product.id)
      .maybeSingle();
    await supabaseAdmin
      .from("products")
      .update({ total_sales: (pCur?.total_sales ?? 0) + (order.quantity ?? 1) })
      .eq("id", product.id);

    // Credit wallet points (2% of order total)
    let pointsEarned = 0;
    if (order.user_id) {
      pointsEarned = Math.max(0, Math.floor(Number(order.total_price ?? 0) * 0.02));
      if (pointsEarned > 0) {
        const { data: u } = await supabaseAdmin
          .from("users" as any)
          .select("wallet_points")
          .eq("id", order.user_id)
          .maybeSingle();
        const cur = Number((u as any)?.wallet_points ?? 0);
        await supabaseAdmin
          .from("users" as any)
          .update({ wallet_points: cur + pointsEarned } as any)
          .eq("id", order.user_id);
        await supabaseAdmin.from("wallet_transactions" as any).insert({
          user_id: order.user_id,
          points: pointsEarned,
          type: "earn",
          order_id: order.id,
          description: `অর্ডার #${order.order_number} থেকে ক্যাশব্যাক`,
        } as any);
        await supabaseAdmin
          .from("orders")
          .update({ wallet_points_earned: pointsEarned } as any)
          .eq("id", order.id);
      }
    }

    // Notify user
    if (order.user_id) {
      const earnLine = pointsEarned > 0 ? ` +${pointsEarned} পয়েন্ট ক্যাশব্যাক!` : "";
      await notifyUser(
        order.user_id,
        "অর্ডার ডেলিভার হয়েছে",
        `${product.title} — অর্ডার #${order.order_number} এর প্রোডাক্ট ডেলিভার হয়েছে।${earnLine}`,
        `/order/${order.id}`,
        "order_delivered",
      );
    }

    return { ok: true, orderId: order.id, pointsEarned };
  });

// ---------- Reject ----------
export const rejectOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        reason: z.string().min(1).max(500),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "rejected",
        delivery_status: "rejected",
        rejection_reason: data.reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.orderId)
      .select("id,user_id,order_number,product_title")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found");

    if (order.user_id) {
      await notifyUser(
        order.user_id,
        "অর্ডার বাতিল করা হয়েছে",
        `${order.product_title} — অর্ডার #${order.order_number} বাতিল। কারণ: ${data.reason}`,
        `/order/${order.id}`,
        "order_rejected",
      );
    }
    return { ok: true };
  });

// ---------- Send custom message to customer ----------
export const sendOrderMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        message: z.string().min(1).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id,user_id,order_number,product_title")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found");
    if (!order.user_id) throw new Error("Order has no user");

    await notifyUser(
      order.user_id,
      `অর্ডার #${order.order_number} — Admin থেকে মেসেজ`,
      data.message,
      `/order/${order.id}`,
      "admin_message",
    );
    return { ok: true };
  });
