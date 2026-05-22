import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { approveAffiliateApp, rejectAffiliateApp } from "@/lib/admin.functions";
import { toast } from "sonner";

const dataQuery = queryOptions({
  queryKey: ["admin", "affiliates"],
  queryFn: async () => {
    const [apps, affs] = await Promise.all([
      supabase.from("affiliate_applications").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("affiliates").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    if (apps.error) throw apps.error;
    if (affs.error) throw affs.error;
    return { apps: apps.data ?? [], affiliates: affs.data ?? [] };
  },
});

export const Route = createFileRoute("/admin/affiliates")({
  head: () => ({ meta: [{ title: "Affiliates — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminAffiliates,
});

function AdminAffiliates() {
  const { data, isLoading } = useQuery(dataQuery);
  const qc = useQueryClient();
  const approve = useServerFn(approveAffiliateApp);
  const reject = useServerFn(rejectAffiliateApp);
  const [tab, setTab] = useState<"pending" | "all" | "affiliates">("pending");

  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;

  const pending = data.apps.filter((a) => a.status === "pending");
  const list = tab === "pending" ? pending : tab === "all" ? data.apps : [];

  const handleApprove = async (id: string) => {
    try {
      const res: any = await approve({ data: { application_id: id } });
      toast.success(`Approved. কোড: ${res.referral_code}`);
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e: any) { toast.error(e.message); }
  };
  const handleReject = async (id: string) => {
    const reason = prompt("Reason?") || "";
    if (!reason) return;
    try {
      await reject({ data: { application_id: id, reason } });
      toast.success("Rejected");
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-2xl">অ্যাফিলিয়েট ম্যানেজমেন্ট</h1>
      <div className="flex gap-2 text-sm">
        {(["pending", "all", "affiliates"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-4 py-2 font-semibold ${tab === t ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass-card hover:bg-accent"}`}>
            {t === "pending" ? `পেন্ডিং (${pending.length})` : t === "all" ? "সব আবেদন" : "অনুমোদিত অ্যাফিলিয়েট"}
          </button>
        ))}
      </div>

      {tab !== "affiliates" ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          {list.length === 0 ? <div className="p-10 text-center text-muted-foreground">কিছু নেই।</div> : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">নাম</th><th className="text-left px-4 py-3">যোগাযোগ</th><th className="text-left px-4 py-3">সোশ্যাল</th><th className="text-left px-4 py-3">স্ট্যাটাস</th><th className="text-right px-4 py-3">অ্যাকশন</th></tr></thead>
              <tbody>
                {list.map((a: any) => (
                  <tr key={a.id} className="border-t border-border">
                    <td className="px-4 py-3 font-semibold">{a.full_name}</td>
                    <td className="px-4 py-3 text-xs">{a.email}<br />{a.phone}</td>
                    <td className="px-4 py-3 text-xs max-w-[200px] truncate">{a.social_links ?? "—"}</td>
                    <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent">{a.status}</span></td>
                    <td className="px-4 py-3 text-right">
                      {a.status === "pending" && (
                        <div className="inline-flex gap-2">
                          <button onClick={() => handleApprove(a.id)} className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground">Approve</button>
                          <button onClick={() => handleReject(a.id)} className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive">Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">কোড</th><th className="text-left px-4 py-3">রেফারেল</th><th className="text-left px-4 py-3">আর্নিং</th><th className="text-left px-4 py-3">ব্যালেন্স</th><th className="text-left px-4 py-3">কমিশন%</th></tr></thead>
            <tbody>
              {data.affiliates.map((a: any) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono font-bold">{a.referral_code}</td>
                  <td className="px-4 py-3">{a.total_referrals ?? 0}</td>
                  <td className="px-4 py-3">{Number(a.total_earnings ?? 0)}৳</td>
                  <td className="px-4 py-3">{Number(a.balance ?? 0)}৳</td>
                  <td className="px-4 py-3">{Number(a.commission_rate ?? 0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
