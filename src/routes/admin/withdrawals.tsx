import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { reviewWithdrawal } from "@/lib/admin.functions";
import { formatBDT } from "@/lib/storefront";
import { toast } from "sonner";

const dataQuery = queryOptions({
  queryKey: ["admin", "withdrawals"],
  queryFn: async () => {
    const [s, a] = await Promise.all([
      supabase.from("seller_withdrawals").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("affiliate_withdrawals").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (s.error) throw s.error;
    if (a.error) throw a.error;
    return { seller: s.data ?? [], affiliate: a.data ?? [] };
  },
});

export const Route = createFileRoute("/admin/withdrawals")({
  head: () => ({ meta: [{ title: "Withdrawals — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminWithdrawals,
});

function AdminWithdrawals() {
  const { data, isLoading } = useQuery(dataQuery);
  const qc = useQueryClient();
  const review = useServerFn(reviewWithdrawal);
  const [tab, setTab] = useState<"seller" | "affiliate">("seller");

  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;
  const rows = tab === "seller" ? data.seller : data.affiliate;

  const act = async (id: string, action: "approved" | "rejected") => {
    let reason: string | undefined;
    if (action === "rejected") {
      reason = prompt("Reason?") || "";
      if (!reason) return;
    }
    try {
      await review({ data: { kind: tab, id, action, reason } });
      toast.success(action === "approved" ? "Paid" : "Rejected");
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-2xl">উইথড্র</h1>
      <div className="flex gap-2 text-sm">
        {(["seller", "affiliate"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 font-semibold capitalize ${tab === t ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass-card hover:bg-accent"}`}>{t}</button>
        ))}
      </div>
      <div className="glass-card rounded-2xl overflow-hidden">
        {rows.length === 0 ? <div className="p-10 text-center text-muted-foreground">কিছু নেই।</div> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">তারিখ</th><th className="text-left px-4 py-3">পরিমাণ</th><th className="text-left px-4 py-3">মাধ্যম</th><th className="text-left px-4 py-3">অ্যাকাউন্ট</th><th className="text-left px-4 py-3">স্ট্যাটাস</th><th className="text-right px-4 py-3">অ্যাকশন</th></tr></thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString("bn-BD")}</td>
                  <td className="px-4 py-3 font-semibold">{formatBDT(Number(r.amount))}</td>
                  <td className="px-4 py-3">{r.payment_method}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.account_number}</td>
                  <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent">{r.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "pending" && (
                      <div className="inline-flex gap-2">
                        <button onClick={() => act(r.id, "approved")} className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground">Pay</button>
                        <button onClick={() => act(r.id, "rejected")} className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
