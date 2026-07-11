import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Points awarded to BOTH referrer and referred user when the referred user
// completes their first order. 1 point = 1 BDT.
export const REFERRAL_REWARD_POINTS = 50;

// Called from register.tsx after a successful OTP verification.
// Reads the referral code the user visited with (stored in localStorage) and
// links the new user to the referrer. Idempotent — silently no-ops if the
// user was already linked or the code is invalid/self.
export const attachReferrer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ code: z.string().trim().min(3).max(20) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;

    // Already linked?
    const { data: existing } = await supabase
      .from("user_referrals")
      .select("id")
      .eq("referred_id", userId)
      .maybeSingle();
    if (existing) return { ok: false, reason: "already_linked" };

    // Load user's own code to prevent self-referral
    const { data: me } = await supabase
      .from("users")
      .select("referral_code")
      .eq("id", userId)
      .maybeSingle();
    if (me?.referral_code && me.referral_code.toUpperCase() === data.code.toUpperCase()) {
      return { ok: false, reason: "self" };
    }

    const { data: referrer } = await supabase
      .from("users")
      .select("id")
      .eq("referral_code", data.code.toUpperCase())
      .maybeSingle();
    if (!referrer) return { ok: false, reason: "invalid" };

    const { error } = await supabase.from("user_referrals").insert({
      referrer_id: referrer.id,
      referred_id: userId,
      status: "pending",
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true };
  });

export const getMyReferralInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;

    const [{ data: me }, { data: referrals }] = await Promise.all([
      supabase.from("users").select("referral_code,wallet_points").eq("id", userId).maybeSingle(),
      supabase
        .from("user_referrals")
        .select("id,referred_id,status,points_awarded,created_at,completed_at")
        .eq("referrer_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    // Enrich with masked email of referred users
    const ids = (referrals ?? []).map((r: any) => r.referred_id);
    let profiles: Record<string, { email: string; full_name: string | null }> = {};
    if (ids.length > 0) {
      const { data: us } = await supabase
        .from("users")
        .select("id,email,full_name")
        .in("id", ids);
      profiles = Object.fromEntries((us ?? []).map((u: any) => [u.id, u]));
    }

    const list = (referrals ?? []).map((r: any) => {
      const p = profiles[r.referred_id];
      const email = p?.email || "";
      const masked = email ? email.replace(/^(.{2}).*(@.*)$/, "$1***$2") : "—";
      return {
        id: r.id,
        status: r.status,
        points_awarded: r.points_awarded,
        created_at: r.created_at,
        completed_at: r.completed_at,
        name: p?.full_name || masked,
        email: masked,
      };
    });

    const totalEarned = list
      .filter((r) => r.status === "completed")
      .reduce((s, r) => s + Number(r.points_awarded || 0), 0);

    return {
      referral_code: (me as any)?.referral_code ?? null,
      wallet_points: Number((me as any)?.wallet_points ?? 0),
      total_referrals: list.length,
      completed_referrals: list.filter((r) => r.status === "completed").length,
      total_earned: totalEarned,
      reward_points: REFERRAL_REWARD_POINTS,
      referrals: list,
    };
  });
