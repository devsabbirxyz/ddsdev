import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { queryOptions } from "@tanstack/react-query";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabase } from "@/integrations/supabase/client";

// Earn: 2% of order total, rounded down. 1 point = 1 BDT.
export const POINTS_EARN_RATE = 0.02;
export const POINT_VALUE_BDT = 1;

export const getMyWallet = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const [{ data: u }, { data: tx }] = await Promise.all([
      supabase.from("users").select("wallet_points").eq("id", userId).maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("id,points,type,order_id,description,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    return {
      balance: Number((u as any)?.wallet_points ?? 0),
      transactions: (tx as any[]) ?? [],
    };
  });

export const walletQuery = () =>
  queryOptions({
    queryKey: ["my-wallet"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("users")
        .select("wallet_points")
        .maybeSingle();
      if (error) throw error;
      const { data: tx, error: txErr } = await (supabase as any)
        .from("wallet_transactions")
        .select("id,points,type,order_id,description,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (txErr) throw txErr;
      return {
        balance: Number(data?.wallet_points ?? 0),
        transactions: (tx as any[]) ?? [],
      };
    },
  });

// Validate-only helper (client-side preview)
export function calcEarn(totalBdt: number): number {
  return Math.max(0, Math.floor(totalBdt * POINTS_EARN_RATE));
}
