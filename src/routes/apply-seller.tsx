import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { applySeller } from "@/lib/seller.functions";
import { toast } from "sonner";

const statusQuery = queryOptions({
  queryKey: ["seller", "application-status"],
  queryFn: async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return null;
    const [{ data: seller }, { data: app }] = await Promise.all([
      supabase.from("sellers").select("status").eq("user_id", uid).maybeSingle(),
      supabase.from("seller_applications").select("status,rejection_reason,created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    return { seller, app, email: sess.session?.user.email ?? "" };
  },
});

export const Route = createFileRoute("/apply-seller")({
  head: () => ({ meta: [{ title: "সেলার আবেদন — DDS-Digital" }] }),
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login", search: { redirect: location.href } as never });
  },
  component: ApplySeller,
});

function ApplySeller() {
  const { data, refetch } = useQuery(statusQuery);
  const apply = useServerFn(applySeller);
  const [form, setForm] = useState({ store_name: "", store_description: "", phone: "", email: "", product_types: "" });
  const [busy, setBusy] = useState(false);

  if (data?.seller?.status === "approved") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
        <h1 className="font-display font-bold text-3xl">আপনি অনুমোদিত সেলার ✅</h1>
        <Link to="/seller" className="inline-block rounded-xl bg-gradient-brand px-6 py-3 font-bold text-primary-foreground shadow-glow">Seller Panel এ যান</Link>
      </div>
    );
  }

  if (data?.app?.status === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-3">
        <h1 className="font-display font-bold text-2xl">আবেদন রিভিউয়ে আছে</h1>
        <p className="text-muted-foreground">Admin অনুমোদন দিলে আপনি Seller Panel এ ঢুকতে পারবেন।</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apply({
        data: {
          store_name: form.store_name,
          store_description: form.store_description || undefined,
          phone: form.phone,
          email: form.email || data?.email || "",
          product_types: form.product_types || undefined,
        },
      });
      toast.success("আবেদন সাবমিট হয়েছে");
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display font-bold text-3xl mb-2">সেলার হিসেবে আবেদন করুন</h1>
      <p className="text-muted-foreground mb-6">DDS-Digital marketplace এ আপনার ডিজিটাল প্রোডাক্ট বিক্রি করুন।</p>

      {data?.app?.status === "rejected" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 mb-4 text-sm">
          পূর্বের আবেদন প্রত্যাখ্যাত: {data.app.rejection_reason ?? "—"}
        </div>
      )}

      <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">
        <input className="ip" placeholder="স্টোর নাম *" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} required />
        <textarea className="ip min-h-[80px]" placeholder="স্টোর সম্পর্কে সংক্ষিপ্ত বিবরণ" value={form.store_description} onChange={(e) => setForm({ ...form, store_description: e.target.value })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <input className="ip" placeholder="ফোন নাম্বার *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <input type="email" className="ip" placeholder={`ইমেইল (${data?.email ?? ""})`} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required={!data?.email} />
        </div>
        <input className="ip" placeholder="কি ধরনের প্রোডাক্ট বিক্রি করবেন?" value={form.product_types} onChange={(e) => setForm({ ...form, product_types: e.target.value })} />
        <button disabled={busy} className="rounded-xl bg-gradient-brand px-6 py-3 font-bold text-primary-foreground shadow-glow disabled:opacity-50 w-full">{busy ? "..." : "আবেদন সাবমিট করুন"}</button>
      </form>
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.7rem 0.9rem;font-size:0.875rem}`}</style>
    </div>
  );
}
