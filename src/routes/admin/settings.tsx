import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveSetting } from "@/lib/admin.functions";
import { toast } from "sonner";

const settingsQuery = queryOptions({
  queryKey: ["admin", "settings"],
  queryFn: async () => {
    const { data, error } = await supabase.from("site_settings").select("*");
    if (error) throw error;
    return data ?? [];
  },
});

const FIELDS = [
  { key: "site_name", label: "সাইট নাম", group: "general" },
  { key: "site_tagline", label: "ট্যাগলাইন", group: "general" },
  { key: "contact_email", label: "যোগাযোগ ইমেইল", group: "contact" },
  { key: "contact_phone", label: "যোগাযোগ ফোন", group: "contact" },
  { key: "whatsapp_number", label: "WhatsApp নম্বর", group: "contact" },
  { key: "facebook_url", label: "Facebook URL", group: "social" },
  { key: "youtube_url", label: "YouTube URL", group: "social" },
  { key: "telegram_url", label: "Telegram URL", group: "social" },
  { key: "footer_about", label: "Footer About Text", group: "general" },
];

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSettings,
});

function AdminSettings() {
  const { data, isLoading } = useQuery(settingsQuery);
  const qc = useQueryClient();
  const save = useServerFn(saveSetting);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    const map: Record<string, string> = {};
    for (const r of data) map[r.key] = r.value ?? "";
    setValues(map);
  }, [data]);

  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      for (const f of FIELDS) {
        await save({ data: { key: f.key, value: values[f.key] ?? "", group_name: f.group } });
      }
      toast.success("সংরক্ষিত");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">সাইট সেটিংস</h1>
      <form onSubmit={submit} className="glass-card rounded-2xl p-6 space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
            <input className="ip" value={values[f.key] ?? ""} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
          </div>
        ))}
        <button className="rounded-xl bg-gradient-brand px-6 py-3 font-bold text-primary-foreground shadow-glow">সংরক্ষণ করুন</button>
      </form>
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid hsl(var(--border));background:transparent;padding:0.7rem 0.9rem;font-size:0.875rem}`}</style>
    </div>
  );
}
