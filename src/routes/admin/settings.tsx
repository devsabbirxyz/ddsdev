import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveSetting } from "@/lib/admin.functions";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { ShieldCheck, ArrowRight } from "lucide-react";

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

const LOGO_KEYS = [
  { key: "site_logo_url", label: "সাইট Logo (Navbar)", group: "branding" },
  { key: "footer_logo_url", label: "Footer Logo", group: "branding" },
  { key: "site_favicon_url", label: "Favicon", group: "branding" },
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
  const [savingLogo, setSavingLogo] = useState<string | null>(null);

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

  const saveLogo = async (key: string, group: string, url: string) => {
    setValues((v) => ({ ...v, [key]: url }));
    setSavingLogo(key);
    try {
      await save({ data: { key, value: url, group_name: group } });
      toast.success("Logo আপডেট হয়েছে ✅");
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingLogo(null); }
  };

  const saveField = async (key: string, value: string, group = "announcement") => {
    setValues((v) => ({ ...v, [key]: value }));
    try {
      await save({ data: { key, value, group_name: group } });
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const ann = {
    enabled: (values.announcement_enabled ?? "1") === "1",
    text: values.announcement_text ?? "",
    link: values.announcement_link ?? "",
    bg: values.announcement_bg || "#7c3aed",
    color: values.announcement_color || "#ffffff",
    scroll: (values.announcement_scroll ?? "1") === "1",
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">সাইট সেটিংস</h1>

      <Link
        to="/admin/admins"
        className="glass-card rounded-2xl p-5 flex items-center justify-between hover:shadow-glow transition-all group"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold">Admin Role Management</div>
            <div className="text-xs text-muted-foreground mt-0.5">Admins, Super Admins, Moderators যোগ ও পরিচালনা করুন</div>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </Link>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="font-bold text-lg">Branding / Logo</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Navbar ও Footer-এ দেখানো Logo পরিবর্তন করুন</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LOGO_KEYS.map((l) => (
            <div key={l.key} className={savingLogo === l.key ? "opacity-60 pointer-events-none" : ""}>
              <ImageUpload
                label={l.label}
                value={values[l.key] ?? ""}
                onChange={(url) => saveLogo(l.key, l.group, url)}
                bucket="admin-uploads"
                folder="branding"
                maxSizeMB={2}
              />
            </div>
          ))}
        </div>
      </div>

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
