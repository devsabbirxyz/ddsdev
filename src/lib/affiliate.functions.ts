import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function genCode(seed: string) {
  const base = seed.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "DDS";
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${base}${rand}`;
}

async function getAffiliate(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("affiliates")
    .select("id,status,referral_code,balance,commission_rate")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Affiliate account not found");
  if (data.status !== "approved") throw new Error("Affiliate account not approved");
  return data;
}

// ---- Apply ----
export const applyAffiliate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      full_name: z.string().min(2).max(100),
      phone: z.string().min(5).max(30),
      email: z.string().email(),
      social_links: z.string().max(1000).optional(),
      reason: z.string().max(2000).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("affiliate_applications").insert({
      user_id: userId,
      full_name: data.full_name,
      phone: data.phone,
      email: data.email,
      social_links: data.social_links ?? null,
      reason: data.reason ?? null,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---- Withdrawal ----
export const requestAffiliateWithdrawal = createServerFn({ method: "POST" })
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
    const aff = await getAffiliate(supabase, userId);
    const { data: a } = await supabase
      .from("affiliates")
      .select("balance")
      .eq("id", aff.id)
      .maybeSingle();
    if (!a || Number(a.balance ?? 0) < data.amount) {
      throw new Error("Insufficient balance");
    }
    const { error } = await supabase.from("affiliate_withdrawals").insert({
      affiliate_id: aff.id,
      amount: data.amount,
      payment_method: data.payment_method,
      account_number: data.account_number,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Export for use by client utils
export { genCode };
