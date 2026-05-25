import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listOffers, saveOffer, deleteOffer } from "@/lib/admin.functions";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, X, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/offers")({
  head: () => ({ meta: [{ title: "Offers — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminOffers,
});

type Form = { id?: string; title: string; title_en: string; image_url: string; link_url: string; sort_order: number; is_active: boolean };
const empty: Form = { title: "", title_en: "", image_url: "", link_url: "", sort_order: 0, is_active: true };

function AdminOffers() {
  const qc = useQueryClient();
  const list = useServerFn(listOffers);
  const save = useServerFn(saveOffer);
  const del = useServerFn(deleteOffer);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "offers"], queryFn: () => list() });

  const [form, setForm] = useState<Form | null>(null);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.image_url) { toast.error("ছবি দিন"); return; }
    try {
      await save({ data: {
        id: form.id, title: form.title, title_en: form.title_en || null,
        image_url: form.image_url, link_url: form.link_url || null,
        sort_order: Number(form.sort_order) || 0, is_active: form.is_active,
      }});
      toast.success(form.id ? "আপডেট হয়েছে ✅" : "অফার যোগ হয়েছে ✅");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin", "offers"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    try { await del({ data: { id } }); toast.success("ডিলিট হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "offers"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">স্পেশাল অফার</h1>
          <p className="text-sm text-muted-foreground mt-1">হোমপেজের special offer cards manage করুন</p>
        </div>
        <button onClick={() => setForm({ ...empty })} className="rounded-xl bg-gradient-brand px-4 py-2.5 font-bold text-primary-foreground shadow-glow text-sm inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> নতুন অফার
        </button>
      </div>

      {form && (
        <form onSubmit={onSave} className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg">{form.id ? "অফার ইডিট" : "নতুন অফার"}</h2>
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
            <div>
              <label className="text-xs text-muted-foreground">Offer Link</label>
              <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/shop?cat=..." className="ip" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Sort Order</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} className="ip" />
            </div>
            <div className="sm:col-span-2">
              <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} bucket="offer-slides" label="অফার ইমেজ *" folder="offers" maxSizeMB={5} />
            </div>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
            </label>
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
      ) : !data?.offers.length ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
          <Plus className="h-10 w-10 mx-auto mb-3 opacity-40" />
          এখনো কোনো অফার নেই — নতুন অফার তৈরি করুন
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.offers.map((o: any) => (
            <div key={o.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="aspect-video bg-muted">
                <img src={o.image_url} alt={o.title} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{o.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{o.title_en || "—"}</div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${o.is_active ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                    {o.is_active ? "ACTIVE" : "OFF"}
                  </span>
                </div>
                {o.link_url && (
                  <a href={o.link_url} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 truncate">
                    <ExternalLink className="h-3 w-3" /> {o.link_url}
                  </a>
                )}
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setForm({ id: o.id, title: o.title, title_en: o.title_en ?? "", image_url: o.image_url, link_url: o.link_url ?? "", sort_order: o.sort_order ?? 0, is_active: o.is_active ?? true })} className="flex-1 rounded-lg glass-card hover:bg-accent px-3 py-1.5 text-xs font-bold inline-flex items-center justify-center gap-1">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={() => remove(o.id)} className="rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 px-3 py-1.5 text-xs font-bold">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.6rem 0.85rem;font-size:0.875rem;margin-top:0.25rem}`}</style>
    </div>
  );
}
