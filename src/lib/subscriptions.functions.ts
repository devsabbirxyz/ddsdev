import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listMySubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const { data, error } = await supabaseAdmin
      .from("subscriptions" as any)
      .select(
        "id,product_id,plan_id,status,auto_renew,started_at,expires_at,last_order_id,payment_method,created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as any[];
    const productIds = Array.from(new Set(rows.map((r) => r.product_id)));
    const planIds = Array.from(new Set(rows.map((r) => r.plan_id)));

    const [{ data: products }, { data: plans }] = await Promise.all([
      productIds.length
        ? supabaseAdmin.from("products").select("id,title,slug").in("id", productIds)
        : Promise.resolve({ data: [] as any[] }),
      planIds.length
        ? supabaseAdmin
            .from("subscription_plans" as any)
            .select("id,name,price,duration_days")
            .in("id", planIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const pMap = new Map((products ?? []).map((p: any) => [p.id, p]));
    const planMap = new Map((plans ?? []).map((p: any) => [p.id, p]));

    return rows.map((r) => ({
      ...r,
      product: pMap.get(r.product_id) ?? null,
      plan: planMap.get(r.plan_id) ?? null,
    }));
  });

const ToggleSchema = z.object({
  id: z.string().uuid(),
  autoRenew: z.boolean(),
});

export const toggleAutoRenew = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ToggleSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { error } = await supabaseAdmin
      .from("subscriptions" as any)
      .update({ auto_renew: data.autoRenew } as any)
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const CancelSchema = z.object({ id: z.string().uuid() });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => CancelSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { error } = await supabaseAdmin
      .from("subscriptions" as any)
      .update({
        status: "cancelled",
        auto_renew: false,
        cancelled_at: new Date().toISOString(),
      } as any)
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
