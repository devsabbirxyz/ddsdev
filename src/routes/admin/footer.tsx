import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveSettingsBulk } from "@/lib/admin.functions";
import { HOMEPAGE_KEYS } from "@/lib/site-settings";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Save } from "lucide-react";
import { toast } from "sonner";

const footerQuery = queryOptions({
  queryKey: ["admin", "footer-settings"],
  queryFn: async () => {
    const { data } = await supabase.from("site_settings").select("key,value");
    const map: Record<string, string> = {};
    for (const r of data ?? []) map[r.key] = r.value ?? "";
    return map;
  },
});

export const Route = createFileRoute("/admin/footer")({
  head: () => ({ meta: [{ title: "Footer CMS — Admin" }, { name: "robots", content: "noindex" }] }),
  component: FooterCMS,
});

function FooterCMS() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(footerQuery);
  const saveB = useServerFn(saveSettingsBulk);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!data) return;
    setForm({
      [HOMEPAGE_KEYS.footer_logo_url]: data[HOMEPAGE_KEYS.footer_logo_url] ?? "",
      [HOMEPAGE_KEYS.footer_about]: data[HOMEPAGE_KEYS.footer_about] ?? "",
      [HOMEPAGE_KEYS.footer_copyright]: data[HOMEPAGE_KEYS.footer_copyright] ?? "© DDS-Digital. All rights reserved.",
      [HOMEPAGE_KEYS.social_facebook]: data[HOMEPAGE_KEYS.social_facebook] ?? "",
      [HOMEPAGE_KEYS.social_instagram]: data[HOMEPAGE_KEYS.social_instagram] ?? "",
      [HOMEPAGE_KEYS.social_youtube]: data[HOMEPAGE_KEYS.social_youtube] ?? "",
      [HOMEPAGE_KEYS.social_telegram]: data[HOMEPAGE_KEYS.social_telegram] ?? "",
      [HOMEPAGE_KEYS.social_whatsapp]: data[HOMEPAGE_KEYS.social_whatsapp] ?? "",
      [HOMEPAGE_KEYS.payment_bkash]: data[HOMEPAGE_KEYS.payment_bkash] ?? "true",
      [HOMEPAGE_KEYS.payment_nagad]: data[HOMEPAGE_KEYS.payment_nagad] ?? "true",
      [HOMEPAGE_KEYS.payment_rocket]: data[HOMEPAGE_KEYS.payment_rocket] ?? "true",
      [HOMEPAGE_KEYS.payment_upay]: data[HOMEPAGE_KEYS.payment_upay] ?? "true",
    });
  }, [data]);

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  const save = async (keys: string[], group: string) => {
    try {
      await saveB({ data: { items: keys.map((k) => ({ key: k, value: form[k] ?? "", group_name: group })) }});
      toast.success("✅ সফলভাবে সংরক্ষিত হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "footer-settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    } catch (e: any) { toast.error("❌ " + (e.message || "সমস্যা হয়েছে")); }
  };

  const fld = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Footer CMS</h1>
        <p className="text-sm text-muted-foreground">Logo, about, social links, payment methods।</p>
      </div>

      {/* Logo + About */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Brand & About</h2>
        <ImageUpload
          value={form[HOMEPAGE_KEYS.footer_logo_url] ?? ""}
          onChange={(url) => fld(HOMEPAGE_KEYS.footer_logo_url, url)}
          bucket="admin-uploads"
          folder="footer"
          label="Footer Logo (optional)"
        />
        <div>
          <label className="text-xs text-muted-foreground">About / Tagline</label>
          <textarea className="ip" rows={3} value={form[HOMEPAGE_KEYS.footer_about] ?? ""} onChange={(e) => fld(HOMEPAGE_KEYS.footer_about, e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Copyright Text</label>
          <input className="ip" value={form[HOMEPAGE_KEYS.footer_copyright] ?? ""} onChange={(e) => fld(HOMEPAGE_KEYS.footer_copyright, e.target.value)} />
        </div>
        <button onClick={() => save([HOMEPAGE_KEYS.footer_logo_url, HOMEPAGE_KEYS.footer_about, HOMEPAGE_KEYS.footer_copyright], "footer")} className="btn bg-gradient-brand text-primary-foreground shadow-glow"><Save className="h-4 w-4" /> Save Brand</button>
      </section>

      {/* Social Links */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Social Links</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { k: HOMEPAGE_KEYS.social_facebook, label: "Facebook URL" },
            { k: HOMEPAGE_KEYS.social_instagram, label: "Instagram URL" },
            { k: HOMEPAGE_KEYS.social_youtube, label: "YouTube URL" },
            { k: HOMEPAGE_KEYS.social_telegram, label: "Telegram URL" },
            { k: HOMEPAGE_KEYS.social_whatsapp, label: "WhatsApp URL (https://wa.me/...)" },
          ].map((f) => (
            <div key={f.k}>
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <input className="ip" placeholder="https://..." value={form[f.k] ?? ""} onChange={(e) => fld(f.k, e.target.value)} />
            </div>
          ))}
        </div>
        <button onClick={() => save([
          HOMEPAGE_KEYS.social_facebook, HOMEPAGE_KEYS.social_instagram, HOMEPAGE_KEYS.social_youtube,
          HOMEPAGE_KEYS.social_telegram, HOMEPAGE_KEYS.social_whatsapp,
        ], "social")} className="btn bg-gradient-brand text-primary-foreground shadow-glow"><Save className="h-4 w-4" /> Save Social</button>
      </section>

      {/* Payments */}
      <section className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Payment Methods (footer badges)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { k: HOMEPAGE_KEYS.payment_bkash, label: "Bkash" },
            { k: HOMEPAGE_KEYS.payment_nagad, label: "Nagad" },
            { k: HOMEPAGE_KEYS.payment_rocket, label: "Rocket" },
            { k: HOMEPAGE_KEYS.payment_upay, label: "Upay" },
          ].map((p) => (
            <label key={p.k} className="flex items-center gap-2 glass-card rounded-xl px-3 py-2 cursor-pointer">
              <input type="checkbox" checked={(form[p.k] ?? "true") !== "false"} onChange={(e) => fld(p.k, e.target.checked ? "true" : "false")} />
              <span className="text-sm font-semibold">{p.label}</span>
            </label>
          ))}
        </div>
        <button onClick={() => save([
          HOMEPAGE_KEYS.payment_bkash, HOMEPAGE_KEYS.payment_nagad,
          HOMEPAGE_KEYS.payment_rocket, HOMEPAGE_KEYS.payment_upay,
        ], "payment")} className="btn bg-gradient-brand text-primary-foreground shadow-glow"><Save className="h-4 w-4" /> Save Payments</button>
      </section>

      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.6rem 0.85rem;font-size:0.875rem}.btn{display:inline-flex;align-items:center;gap:0.4rem;border-radius:0.75rem;padding:0.5rem 1rem;font-weight:600;font-size:0.875rem}`}</style>
    </div>
  );
}
