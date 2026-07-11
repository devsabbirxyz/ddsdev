import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listBundles, saveBundle, deleteBundle } from "@/lib/bundles";
import { productsQuery } from "@/lib/storefront";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, Package } from "lucide-react";

export const Route = createFileRoute("/admin/bundles")({
  head: () => ({ meta: [{ title: "Bundles — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminBundles,
});

type Form = {
  id?: string;
  title: string;
  title_en: string;
  description: string;
  discount_percent: number;
  is_active: boolean;
  sort_order: number;
  image_url: string;
  product_ids: string[];
};
const empty: Form = {
  title: "", title_en: "", description: "", discount_percent: 20,
  is_active: true, sort_order: 0, image_url: "", product_ids: [],
};

function AdminBundles() {
  const qc = useQueryClient();
  const list = useServerFn(listBundles);
  const save = useServerFn(saveBundle);
  const del = useServerFn(deleteBundle);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "bundles"], queryFn: () => list() });
  const { data: allProducts = [] } = useQuery(productsQuery({ limit: 200 }));

  const [form, setForm] = useState<Form | null>(null);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (form.product_ids.length < 2) { toast.error("কমপক্ষে ২টি প্রোডাক্ট নির্বাচন করুন"); return; }
    try {
      await save({ data: {
        id: form.id, title: form.title, title_en: form.title_en || null,
        description: form.description || null, discount_percent: Number(form.discount_percent),
        is_active: form.is_active, sort_order: Number(form.sort_order) || 0,
        image_url: form.image_url || null, product_ids: form.product_ids,
      }});
      toast.success(form.id ? "আপডেট হয়েছে ✅" : "বান্ডল যোগ হয়েছে ✅");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "bundles"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    try {
      await del({ data: { id } });
      toast.success("ডিলিট হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "bundles"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const toggleProduct = (pid: string) => {
    if (!form) return;
    const has = form.product_ids.includes(pid);
    setForm({
      ...form,
      product_ids: has ? form.product_ids.filter(x => x !== pid) : [...form.product_ids, pid].slice(0, 10),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">বান্ডল অফার</h1>
          <p className="text-sm text-muted-foreground mt-1">কম্বো প্যাকেজ তৈরি করুন — একসাথে কিনলে বেশি ছাড়</p>
        </div>
        <button onClick={() => setForm({ ...empty })} className="rounded-xl bg-gradient-brand px-4 py-2.5 font-bold text-primary-foreground shadow-glow text-sm inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> নতুন বান্ডল
        </button>
      </div>

      {form && (
        <form onSubmit={onSave} className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{form.id ? "বান্ডল ইডিট" : "নতুন বান্ডল"}</h2>
            <button type="button" onClick={() => setForm(null)} className="rounded-lg p-1.5 hover:bg-accent"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Title (বাংলা) *</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="ip" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Title (English)</label>
              <input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} className="ip" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="ip" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">ছাড় (%)</label>
              <input type="number" min={0} max={100} value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })} className="ip" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="ip" />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
            </label>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">প্রোডাক্ট বাছাই (২-১০টি) — {form.product_ids.length} selected</label>
            <div className="mt-2 max-h-64 overflow-y-auto glass-card rounded-xl p-2 grid sm:grid-cols-2 gap-1">
              {allProducts.map((p: any) => {
                const on = form.product_ids.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`text-left rounded-lg px-3 py-2 text-xs transition ${on ? "bg-gradient-brand text-primary-foreground" : "hover:bg-accent"}`}
                  >
                    {on && "✓ "}{p.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="rounded-xl bg-gradient-brand px-5 py-2.5 font-bold text-primary-foreground shadow-glow text-sm inline-flex items-center gap-2">
              <Save className="h-4 w-4" /> সেভ করুন
            </button>
            <button type="button" onClick={() => setForm(null)} className="rounded-xl border border-border px-5 py-2.5 font-bold text-sm">বাতিল</button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-muted-foreground">লোড হচ্ছে...</div>
      ) : !data?.bundles.length ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          এখনো কোনো বান্ডল নেই — নতুন বান্ডল তৈরি করুন
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {data.bundles.map((b: any) => (
            <div key={b.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold">{b.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{b.title_en || "—"}</div>
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${b.is_active ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                  {b.is_active ? "ACTIVE" : "OFF"}
                </span>
              </div>
              <div className="mt-2 text-xs text-primary font-bold">Save {b.discount_percent}%</div>
              <div className="mt-2 text-xs text-muted-foreground">
                {b.items?.length ?? 0}টি প্রোডাক্ট: {(b.items ?? []).map((it: any) => it.product?.title).filter(Boolean).join(", ")}
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  onClick={() => setForm({
                    id: b.id, title: b.title, title_en: b.title_en ?? "",
                    description: b.description ?? "", discount_percent: Number(b.discount_percent),
                    is_active: b.is_active, sort_order: b.sort_order ?? 0,
                    image_url: b.image_url ?? "",
                    product_ids: (b.items ?? []).map((it: any) => it.product_id),
                  })}
                  className="flex-1 rounded-lg glass-card hover:bg-accent px-3 py-1.5 text-xs font-bold inline-flex items-center justify-center gap-1"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button onClick={() => remove(b.id)} className="rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 px-3 py-1.5 text-xs font-bold">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.6rem 0.85rem;font-size:0.875rem;margin-top:0.25rem}`}</style>
    </div>
  );
}
