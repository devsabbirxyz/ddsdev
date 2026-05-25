import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveCategory, deleteCategory } from "@/lib/admin.functions";
import { toast } from "sonner";

const catsQuery = queryOptions({
  queryKey: ["admin", "categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order").limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminCategories,
});

function AdminCategories() {
  const { data, isLoading } = useQuery(catsQuery);
  const qc = useQueryClient();
  const save = useServerFn(saveCategory);
  const del = useServerFn(deleteCategory);
  const [form, setForm] = useState({ id: "", name: "", name_en: "", icon_url: "", sort_order: 0, is_active: true });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await save({
        data: {
          id: form.id || undefined,
          name: form.name,
          name_en: form.name_en || null,
          icon_url: form.icon_url || null,
          sort_order: Number(form.sort_order) || 0,
          is_active: form.is_active,
        },
      });
      toast.success("সংরক্ষিত");
      setForm({ id: "", name: "", name_en: "", icon_url: "", sort_order: 0, is_active: true });
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await del({ data: { id } }); toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "categories"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">ক্যাটাগরি</h1>
      <form onSubmit={submit} className="glass-card rounded-2xl p-5 grid sm:grid-cols-2 gap-3">
        <input className="ip" placeholder="নাম *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="ip" placeholder="Name (English)" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
        <input className="ip" placeholder="Icon URL" value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} />
        <input className="ip" type="number" placeholder="Sort order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <div className="sm:col-span-2 flex gap-2">
          <button className="rounded-xl bg-gradient-brand px-5 py-2.5 font-bold text-primary-foreground shadow-glow text-sm">{form.id ? "আপডেট" : "যোগ করুন"}</button>
          {form.id && <button type="button" onClick={() => setForm({ id: "", name: "", name_en: "", icon_url: "", sort_order: 0, is_active: true })} className="rounded-xl border border-border px-5 py-2.5 font-bold text-sm">বাতিল</button>}
        </div>
      </form>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">নাম</th><th className="text-left px-4 py-3">Slug</th><th className="text-left px-4 py-3">Sort</th><th className="text-left px-4 py-3">Active</th><th className="text-right px-4 py-3">অ্যাকশন</th></tr></thead>
          <tbody>
            {data.map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-semibold">{c.name}<div className="text-xs text-muted-foreground">{c.name_en}</div></td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">{c.sort_order}</td>
                <td className="px-4 py-3">{c.is_active ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <button onClick={() => setForm({ id: c.id, name: c.name, name_en: c.name_en ?? "", icon_url: c.icon_url ?? "", sort_order: c.sort_order ?? 0, is_active: c.is_active ?? true })} className="rounded-lg border border-border px-3 py-1.5 text-xs">Edit</button>
                    <button onClick={() => remove(c.id)} className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs text-destructive">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.6rem 0.85rem;font-size:0.875rem}`}</style>
    </div>
  );
}
