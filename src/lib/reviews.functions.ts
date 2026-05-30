import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const reviewInput = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  text: z.string().max(2000).optional().nullable(),
});

async function recomputeProductRating(productId: string) {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_active", true);
  if (error) return;
  const rows = data ?? [];
  const total = rows.length;
  const avg = total === 0 ? 0 : rows.reduce((s, r) => s + Number(r.rating || 0), 0) / total;
  await supabaseAdmin
    .from("products")
    .update({
      total_reviews: total,
      average_rating: Math.round(avg * 10) / 10,
    })
    .eq("id", productId);
}

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => reviewInput.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Validate: order belongs to user and is approved, get product_id
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("id,user_id,product_id,status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderErr || !order) throw new Error("অর্ডার পাওয়া যায়নি");
    if (order.user_id !== userId) throw new Error("অননুমোদিত");
    if (order.status !== "approved") throw new Error("শুধু সফল অর্ডারে রিভিউ দেওয়া যাবে");
    if (!order.product_id) throw new Error("প্রোডাক্ট পাওয়া যায়নি");

    // Upsert: one review per (order, user)
    const { data: existing } = await supabaseAdmin
      .from("reviews")
      .select("id")
      .eq("order_id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("reviews")
        .update({
          rating: data.rating,
          review_text: data.text ?? null,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("reviews").insert({
        order_id: data.orderId,
        user_id: userId,
        product_id: order.product_id,
        rating: data.rating,
        review_text: data.text ?? null,
        is_active: true,
      });
      if (error) throw new Error(error.message);
    }

    // Mark order as reviewed
    await supabaseAdmin
      .from("orders")
      .update({ is_reviewed: true })
      .eq("id", data.orderId);

    await recomputeProductRating(order.product_id);

    return { ok: true };
  });
