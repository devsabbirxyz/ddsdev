import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { updateStore } from "@/lib/seller.functions";
import { toast } from "sonner";

const storeQuery = queryOptions({
  queryKey: ["seller", "store"],
  queryFn: async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return null;
    const { data } = await supabase.from("sellers").select("*").eq("user_id", uid).maybeSingle();
    return data;
  },
});

export const Route = createFileRoute("/_seller/store")({
  head: () => ({ meta: [{ title: "Store Settings — Seller" }, { name: "robots", content: "noindex" }] }),
  component: StoreSettings,
});

function StoreSettings() {
  const { data: store } = useQuery(storeQuery);
  const qc = useQueryClient();
  const save = useServerFn(updateStore);
  const [form, setForm] = useState({ store_name: "", store_description: "", store_logo_url: "", store_cover_url: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (store) setForm({
      store_name: store.store_name ?? "",
      store_description: store.store_description ?? "",
      store_logo_url: store.store_logo_url ?? "",
      store_cover_url: store.store_cover_url ?? "",
    });
  }, [store]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await save({
        data: {
          store_name: form.store_name,
          store_description: form.store_description || null,
          store_logo_url: form.store_logo_url || null,
          store_cover_url: form.store_cover_url || null,
        },
      });
      toast.success("আপডেট হয়েছে");
      qc.invalidateQueries({ queryKey: ["seller", "store"] });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
      <h1 className="font-display font-bold text-2xl">স্টোর সেটিংস</h1>
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <Field label="স্টোর নাম">
          <input className="ip" value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} required />
        </Field>
        <Field label="ডেসক্রিপশন">
          <textarea className="ip min-h-[100px]" value={form.store_description} onChange={(e) => setForm({ ...form, store_description: e.target.value })} />
        </Field>
        <Field label="লোগো URL">
          <input className="ip" value={form.store_logo_url} onChange={(e) => setForm({ ...form, store_logo_url: e.target.value })} />
        </Field>
        <Field label="কভার URL">
          <input className="ip" value={form.store_cover_url} onChange={(e) => setForm({ ...form, store_cover_url: e.target.value })} />
        </Field>
      </div>
      <button disabled={busy} className="rounded-xl bg-gradient-brand px-6 py-3 font-bold text-primary-foreground shadow-glow disabled:opacity-50">{busy ? "..." : "সেভ করুন"}</button>
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid hsl(var(--border));background:transparent;padding:0.6rem 0.8rem;font-size:0.875rem}`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold mb-1 text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
