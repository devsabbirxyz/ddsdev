import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveSlide, deleteSlide } from "@/lib/admin.functions";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";


const slidesQuery = queryOptions({
  queryKey: ["admin", "slides"],
  queryFn: async () => {
    const [h, o, r] = await Promise.all([
      supabase.from("hero_slides").select("*").order("sort_order"),
      supabase.from("offer_slides").select("*").order("sort_order"),
      supabase.from("review_slides").select("*").order("sort_order"),
    ]);
    if (h.error) throw h.error;
    if (o.error) throw o.error;
    if (r.error) throw r.error;
    return { hero: h.data ?? [], offer: o.data ?? [], review: r.data ?? [] };
  },
});

export const Route = createFileRoute("/admin/slides")({
  head: () => ({ meta: [{ title: "Slides — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSlides,
});

function AdminSlides() {
  const { data, isLoading } = useQuery(slidesQuery);
  const qc = useQueryClient();
  const save = useServerFn(saveSlide);
  const del = useServerFn(deleteSlide);
  const [kind, setKind] = useState<"hero" | "offer" | "review">("hero");
  const [form, setForm] = useState({ id: "", image_url: "", link_url: "", alt_text: "", sort_order: 0, is_active: true });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;
  const list = kind === "hero" ? data.hero : kind === "offer" ? data.offer : data.review;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save({
        data: {
          kind,
          id: form.id || undefined,
          image_url: form.image_url,
          link_url: form.link_url || null,
          alt_text: form.alt_text || null,
          sort_order: Number(form.sort_order) || 0,
          is_active: form.is_active,
        },
      });
      toast.success("সংরক্ষিত");
      setForm({ id: "", image_url: "", link_url: "", alt_text: "", sort_order: 0, is_active: true });
      qc.invalidateQueries({ queryKey: ["admin", "slides"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await del({ data: { kind, id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "slides"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">স্লাইডার</h1>
      <div className="flex gap-2 text-sm flex-wrap">
        {(["hero", "offer", "review"] as const).map((k) => (
          <button key={k} onClick={() => { setKind(k); setForm({ id: "", image_url: "", link_url: "", alt_text: "", sort_order: 0, is_active: true }); }} className={`rounded-xl px-4 py-2 font-semibold capitalize ${kind === k ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass-card hover:bg-accent"}`}>{k}</button>
        ))}
      </div>


      <form onSubmit={submit} className="glass-card rounded-2xl p-5 grid sm:grid-cols-2 gap-3">
        <input className="ip sm:col-span-2" placeholder="Image URL *" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} required />
        <input className="ip" placeholder="Link URL" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
        <input className="ip" placeholder="Alt text" value={form.alt_text} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} />
        <input className="ip" type="number" placeholder="Sort order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <div className="sm:col-span-2"><button className="rounded-xl bg-gradient-brand px-5 py-2.5 font-bold text-primary-foreground shadow-glow text-sm">{form.id ? "আপডেট" : "যোগ করুন"}</button></div>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((s: any) => (
          <div key={s.id} className="glass-card rounded-2xl overflow-hidden">
            <div className="aspect-[16/9] bg-muted overflow-hidden">
              <img src={s.image_url} alt={s.alt_text ?? ""} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-3 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold">#{s.sort_order} {s.is_active ? "" : "(off)"}</div>
                <div className="text-muted-foreground truncate max-w-[150px]">{s.link_url ?? "—"}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setForm({ id: s.id, image_url: s.image_url, link_url: s.link_url ?? "", alt_text: s.alt_text ?? "", sort_order: s.sort_order ?? 0, is_active: s.is_active ?? true })} className="rounded-lg border border-border px-2 py-1">Edit</button>
                <button onClick={() => remove(s.id)} className="rounded-lg border border-destructive/40 px-2 py-1 text-destructive">×</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.6rem 0.85rem;font-size:0.875rem}`}</style>
    </div>
  );
}
