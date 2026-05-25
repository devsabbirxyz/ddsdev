import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveSettingsBulk } from "@/lib/admin.functions";
import { HOMEPAGE_KEYS } from "@/lib/site-settings";
import { Save, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

const newsletterQuery = queryOptions({
  queryKey: ["admin", "newsletter"],
  queryFn: async () => {
    const [{ data: subs }, { data: settings }] = await Promise.all([
      supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }).limit(1000),
      supabase.from("site_settings").select("key,value"),
    ]);
    const map: Record<string, string> = {};
    for (const r of settings ?? []) map[r.key] = r.value ?? "";
    return { subs: subs ?? [], settings: map };
  },
});

export const Route = createFileRoute("/admin/newsletter")({
  head: () => ({ meta: [{ title: "Newsletter — Admin" }, { name: "robots", content: "noindex" }] }),
  component: NewsletterCMS,
});

function NewsletterCMS() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(newsletterQuery);
  const saveB = useServerFn(saveSettingsBulk);
  const [form, setForm] = useState({
    [HOMEPAGE_KEYS.newsletter_heading]: "",
    [HOMEPAGE_KEYS.newsletter_sub]: "",
    [HOMEPAGE_KEYS.newsletter_enabled]: "true",
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!data) return;
    setForm({
      [HOMEPAGE_KEYS.newsletter_heading]: data.settings[HOMEPAGE_KEYS.newsletter_heading] ?? "নতুন অফারের আপডেট পেতে চান?",
      [HOMEPAGE_KEYS.newsletter_sub]: data.settings[HOMEPAGE_KEYS.newsletter_sub] ?? "ইমেইল দিয়ে সাবস্ক্রাইব করুন।",
      [HOMEPAGE_KEYS.newsletter_enabled]: data.settings[HOMEPAGE_KEYS.newsletter_enabled] ?? "true",
    });
  }, [data]);

  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;

  const subs = data.subs.filter((s: any) => !search || (s.email ?? "").toLowerCase().includes(search.toLowerCase()));

  const save = async () => {
    try {
      await saveB({ data: { items: Object.entries(form).map(([key, value]) => ({ key, value: String(value), group_name: "newsletter" })) }});
      toast.success("✅ সফলভাবে সংরক্ষিত হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "newsletter"] });
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    } catch (e: any) { toast.error("❌ " + (e.message || "সমস্যা হয়েছে")); }
  };

  const exportCSV = () => {
    const rows = [["Email", "Subscribed At"], ...subs.map((s: any) => [s.email ?? "", s.created_at ?? ""])];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("✅ CSV ডাউনলোড হয়েছে");
  };

  const removeOne = async (id: string) => {
    if (!confirm("⚠️ এই সাবস্ক্রাইবার ডিলিট হবে?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) { toast.error("❌ " + error.message); return; }
    toast.success("✅ ডিলিট হয়েছে");
    qc.invalidateQueries({ queryKey: ["admin", "newsletter"] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Newsletter</h1>
        <p className="text-sm text-muted-foreground">Heading edit, subscriber list, CSV export।</p>
      </div>

      {/* Settings */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-lg">Newsletter Settings</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form[HOMEPAGE_KEYS.newsletter_enabled] !== "false"} onChange={(e) => setForm({ ...form, [HOMEPAGE_KEYS.newsletter_enabled]: e.target.checked ? "true" : "false" })} />
            Show newsletter section on homepage
          </label>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Heading</label>
          <input className="ip" value={form[HOMEPAGE_KEYS.newsletter_heading]} onChange={(e) => setForm({ ...form, [HOMEPAGE_KEYS.newsletter_heading]: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Subtitle</label>
          <input className="ip" value={form[HOMEPAGE_KEYS.newsletter_sub]} onChange={(e) => setForm({ ...form, [HOMEPAGE_KEYS.newsletter_sub]: e.target.value })} />
        </div>
        <button onClick={save} className="btn bg-gradient-brand text-primary-foreground shadow-glow"><Save className="h-4 w-4" /> Save</button>
      </section>

      {/* Subscribers */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-bold text-lg">Subscribers ({data.subs.length})</h2>
          <div className="flex gap-2">
            <input className="ip" placeholder="Search email..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
            <button onClick={exportCSV} className="btn glass-card"><Download className="h-4 w-4" /> Export CSV</button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Subscribed</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: any) => (
                <tr key={s.id} className="border-b border-border/40">
                  <td className="p-2">{s.email}</td>
                  <td className="p-2 text-muted-foreground text-xs">{s.created_at ? new Date(s.created_at).toLocaleString() : ""}</td>
                  <td className="p-2"><button onClick={() => removeOne(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
              {subs.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">কোনো সাবস্ক্রাইবার নেই।</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`.ip{border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.6rem 0.85rem;font-size:0.875rem;width:100%}.btn{display:inline-flex;align-items:center;gap:0.4rem;border-radius:0.75rem;padding:0.5rem 1rem;font-weight:600;font-size:0.875rem}`}</style>
    </div>
  );
}
