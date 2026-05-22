import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { requestAffiliateWithdrawal } from "@/lib/affiliate.functions";
import { formatBDT } from "@/lib/storefront";
import { toast } from "sonner";

const withdrawalsQuery = queryOptions({
  queryKey: ["affiliate", "withdrawals"],
  queryFn: async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) throw new Error("Not authenticated");
    const { data: aff } = await supabase
      .from("affiliates")
      .select("id,balance")
      .eq("user_id", uid)
      .maybeSingle();
    if (!aff) return { balance: 0, rows: [] };
    const { data, error } = await supabase
      .from("affiliate_withdrawals")
      .select("*")
      .eq("affiliate_id", aff.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { balance: Number(aff.balance ?? 0), rows: data ?? [] };
  },
});

export const Route = createFileRoute("/affiliate/withdrawals")({
  head: () => ({ meta: [{ title: "Withdrawals — Affiliate" }, { name: "robots", content: "noindex" }] }),
  component: AffiliateWithdrawals,
});

function AffiliateWithdrawals() {
  const { data, isLoading } = useQuery(withdrawalsQuery);
  const qc = useQueryClient();
  const request = useServerFn(requestAffiliateWithdrawal);
  const [form, setForm] = useState({ amount: "", payment_method: "bKash", account_number: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!amount || amount < 100) return toast.error("মিনিমাম ১০০৳");
    setBusy(true);
    try {
      await request({
        data: { amount, payment_method: form.payment_method, account_number: form.account_number },
      });
      toast.success("উইথড্র রিকোয়েস্ট সাবমিট হয়েছে");
      setForm({ amount: "", payment_method: "bKash", account_number: "" });
      qc.invalidateQueries({ queryKey: ["affiliate"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">উইথড্র</h1>
        <div className="text-sm text-muted-foreground">
          ব্যালেন্স: <span className="font-display font-bold text-lg text-foreground">{formatBDT(data.balance)}</span>
        </div>
      </div>

      <form onSubmit={submit} className="glass-card rounded-2xl p-6 grid sm:grid-cols-3 gap-3">
        <input className="ip" type="number" min={100} placeholder="পরিমাণ (৳)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <select className="ip" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
          <option>bKash</option>
          <option>Nagad</option>
          <option>Rocket</option>
          <option>Bank</option>
        </select>
        <input className="ip" placeholder="অ্যাকাউন্ট নাম্বার" value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} required />
        <div className="sm:col-span-3">
          <button disabled={busy} className="rounded-xl bg-gradient-brand px-6 py-3 font-bold text-primary-foreground shadow-glow disabled:opacity-50">{busy ? "..." : "রিকোয়েস্ট সাবমিট করুন"}</button>
        </div>
      </form>

      <div className="glass-card rounded-2xl overflow-hidden">
        {data.rows.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">কোনো উইথড্র রিকোয়েস্ট নেই।</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">তারিখ</th>
                <th className="text-left px-4 py-3">পরিমাণ</th>
                <th className="text-left px-4 py-3">মাধ্যম</th>
                <th className="text-left px-4 py-3">অ্যাকাউন্ট</th>
                <th className="text-left px-4 py-3">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r: any) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3">{new Date(r.created_at).toLocaleDateString("bn-BD")}</td>
                  <td className="px-4 py-3 font-semibold">{formatBDT(Number(r.amount))}</td>
                  <td className="px-4 py-3">{r.payment_method}</td>
                  <td className="px-4 py-3 font-mono text-xs">{r.account_number}</td>
                  <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent">{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid hsl(var(--border));background:transparent;padding:0.7rem 0.9rem;font-size:0.875rem}`}</style>
    </div>
  );
}
