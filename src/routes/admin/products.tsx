import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { reviewProduct } from "@/lib/admin.functions";
import { formatBDT } from "@/lib/storefront";
import { toast } from "sonner";

const productsQuery = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,title,slug,status,regular_price,offer_price,delivery_type,created_at,seller_id")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

function AdminProducts() {
  const { data, isLoading } = useQuery(productsQuery);
  const qc = useQueryClient();
  const review = useServerFn(reviewProduct);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;
  const filtered = status === "all" ? data : data.filter((p) => p.status === status);

  const act = async (id: string, action: "approved" | "rejected") => {
    let reason: string | undefined;
    if (action === "rejected") {
      reason = prompt("Reason?") || "";
      if (!reason) return;
    }
    try {
      await review({ data: { product_id: id, status: action, reason } });
      toast.success(action === "approved" ? "Approved" : "Rejected");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-2xl">প্রোডাক্ট রিভিউ</h1>
      <div className="flex gap-2 text-sm flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`rounded-xl px-4 py-2 font-semibold capitalize ${status === s ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass-card hover:bg-accent"}`}>{s} ({s === "all" ? data.length : data.filter(d => d.status === s).length})</button>
        ))}
      </div>
      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? <div className="p-10 text-center text-muted-foreground">কিছু নেই।</div> : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">প্রোডাক্ট</th><th className="text-left px-4 py-3">টাইপ</th><th className="text-left px-4 py-3">মূল্য</th><th className="text-left px-4 py-3">স্ট্যাটাস</th><th className="text-right px-4 py-3">অ্যাকশন</th></tr></thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3"><div className="font-semibold">{p.title}</div><div className="text-xs text-muted-foreground font-mono">/{p.slug}</div></td>
                  <td className="px-4 py-3 text-xs">{p.delivery_type}</td>
                  <td className="px-4 py-3">{formatBDT(Number(p.offer_price ?? p.regular_price ?? 0))}</td>
                  <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent">{p.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    {p.status === "pending" && (
                      <div className="inline-flex gap-2">
                        <button onClick={() => act(p.id, "approved")} className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground">Approve</button>
                        <button onClick={() => act(p.id, "rejected")} className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-bold text-destructive">Reject</button>
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
