import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";

const referralsQuery = queryOptions({
  queryKey: ["affiliate", "referrals"],
  queryFn: async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) throw new Error("Not authenticated");
    const { data: aff } = await supabase
      .from("affiliates")
      .select("id")
      .eq("user_id", uid)
      .maybeSingle();
    if (!aff) return [];
    const { data, error } = await supabase
      .from("affiliate_referrals")
      .select("id,commission_amount,status,created_at,order_id")
      .eq("affiliate_id", aff.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/affiliate/referrals")({
  head: () => ({ meta: [{ title: "Referrals — Affiliate" }, { name: "robots", content: "noindex" }] }),
  component: AffiliateReferrals,
});

function AffiliateReferrals() {
  const { data, isLoading } = useQuery(referralsQuery);
  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-2xl">রেফারেল কমিশন</h1>
      {rows.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">কোনো রেফারেল কমিশন এখনো নেই।</div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">তারিখ</th>
                <th className="text-left px-4 py-3">অর্ডার</th>
                <th className="text-left px-4 py-3">কমিশন</th>
                <th className="text-left px-4 py-3">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{new Date(r.created_at ?? "").toLocaleDateString("bn-BD")}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.order_id?.slice(0, 8) ?? "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatBDT(Number(r.commission_amount ?? 0))}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent">{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
