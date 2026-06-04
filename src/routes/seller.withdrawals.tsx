import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";
import { requestSellerWithdrawal } from "@/lib/seller.functions";
import { getMySellerBalance } from "@/lib/seller-owner.functions";
import { toast } from "sonner";

const wdQuery = queryOptions({
  queryKey: ["seller", "withdrawals"],
  queryFn: async () => {
    const seller = await getMySellerBalance();
    if (!seller) return { seller: null as any, list: [] as any[] };
    const { data } = await supabase
      .from("seller_withdrawals")
      .select("id,amount,payment_method,account_number,status,created_at,processed_at,rejection_reason")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false });
    return { seller, list: data ?? [] };
  },
});

export const Route = createFileRoute("/seller/withdrawals")({
  head: () => ({ meta: [{ title: "Withdrawals — Seller" }, { name: "robots", content: "noindex" }] }),
  component: SellerWithdrawals,
});

function SellerWithdrawals() {
  const { data, isLoading } = useQuery(wdQuery);
  const qc = useQueryClient();
  const req = useServerFn(requestSellerWithdrawal);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bKash");
  const [acc, setAcc] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await req({ data: { amount: Number(amount), payment_method: method, account_number: acc } });
      toast.success("রিকোয়েস্ট সাবমিট হয়েছে");
      setAmount(""); setAcc("");
      qc.invalidateQueries({ queryKey: ["seller", "withdrawals"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="glass-card rounded-2xl p-5">
        <div className="text-xs text-muted-foreground">উপলব্ধ ব্যালেন্স</div>
        <div className="text-3xl font-display font-bold mt-1">{formatBDT(Number(data?.seller?.balance ?? 0))}</div>
      </div>

      <form onSubmit={submit} className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold">নতুন উইথড্র রিকোয়েস্ট</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input type="number" min="100" placeholder="পরিমাণ (৳)" className="rounded-xl border border-border bg-transparent px-3 py-2 text-sm" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <select className="rounded-xl border border-border bg-transparent px-3 py-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>bKash</option><option>Nagad</option><option>Rocket</option><option>Bank</option>
          </select>
          <input placeholder="অ্যাকাউন্ট নাম্বার" className="rounded-xl border border-border bg-transparent px-3 py-2 text-sm" value={acc} onChange={(e) => setAcc(e.target.value)} required />
        </div>
        <button disabled={busy} className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-50">{busy ? "..." : "রিকোয়েস্ট পাঠান"}</button>
      </form>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-background/40">
            <tr className="text-left">
              <th className="px-4 py-3 text-xs font-bold uppercase">Date</th>
              <th className="px-4 py-3 text-xs font-bold uppercase">Amount</th>
              <th className="px-4 py-3 text-xs font-bold uppercase">Method</th>
              <th className="px-4 py-3 text-xs font-bold uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data?.list ?? []).length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">কোনো রিকোয়েস্ট নেই</td></tr>}
            {(data?.list ?? []).map((w: any) => (
              <tr key={w.id} className="border-t border-border/40">
                <td className="px-4 py-3 text-xs">{new Date(w.created_at).toLocaleDateString("bn-BD")}</td>
                <td className="px-4 py-3 font-semibold">{formatBDT(Number(w.amount))}</td>
                <td className="px-4 py-3">{w.payment_method} · <span className="font-mono text-xs">{w.account_number}</span></td>
                <td className="px-4 py-3">
                  <span className="text-xs">{w.status}</span>
                  {w.rejection_reason && <div className="text-[11px] text-destructive">{w.rejection_reason}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
