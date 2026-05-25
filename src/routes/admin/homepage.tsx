import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveSlide, deleteSlide, saveSettingsBulk } from "@/lib/admin.functions";
import { HOMEPAGE_KEYS, parseTrustBar, parsePromoSection, DEFAULT_PROMO, type TrustItem, type PromoSection, type PromoStat } from "@/lib/site-settings";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

const cmsQuery = queryOptions({
  queryKey: ["admin", "homepage-cms"],
  queryFn: async () => {
    const [hero, offer, review, settings] = await Promise.all([
      supabase.from("hero_slides").select("*").order("sort_order"),
      supabase.from("offer_slides").select("*").order("sort_order"),
      supabase.from("review_slides").select("*").order("sort_order"),
      supabase.from("site_settings").select("key,value"),
    ]);
    const map: Record<string, string> = {};
    for (const r of settings.data ?? []) map[r.key] = r.value ?? "";
    return {
      hero: hero.data ?? [],
      offer: offer.data ?? [],
      review: review.data ?? [],
      settings: map,
    };
  },
});

export const Route = createFileRoute("/admin/homepage")({
  head: () => ({ meta: [{ title: "Homepage CMS — Admin" }, { name: "robots", content: "noindex" }] }),
  component: HomepageCMS,
});

const TABS = [
  { id: "hero", label: "Navbar + Hero" },
  { id: "offer", label: "Offer Banner" },
  { id: "promo", label: "Promo Section" },
  { id: "trust", label: "Trust Bar" },
  { id: "reviews", label: "Review Slides" },
] as const;
type TabId = typeof TABS[number]["id"];

function HomepageCMS() {
  const [tab, setTab] = useState<TabId>("hero");
  const { data, isLoading } = useQuery(cmsQuery);
  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">হোমপেজ CMS</h1>
      <p className="text-sm text-muted-foreground">হোমপেজের সব কন্টেন্ট, ইমেজ আর টেক্সট এখান থেকে চেঞ্জ করুন।</p>
      <div className="flex flex-wrap gap-2 text-sm border-b border-border pb-3">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 font-semibold ${tab === t.id ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass-card hover:bg-accent"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "hero" && <HeroTab settings={data.settings} slides={data.hero} />}
      {tab === "offer" && <OfferTab slides={data.offer} />}
      {tab === "promo" && <PromoTab settings={data.settings} />}
      {tab === "trust" && <TrustTab settings={data.settings} />}
      {tab === "reviews" && <ReviewTab slides={data.review} />}
      <div className="text-xs text-muted-foreground">
        💡 Footer ও Newsletter এখন আলাদা পেজে — <a href="/admin/footer" className="text-primary underline">/admin/footer</a> এবং <a href="/admin/newsletter" className="text-primary underline">/admin/newsletter</a>
      </div>
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.6rem 0.85rem;font-size:0.875rem}.btn{display:inline-flex;align-items:center;gap:0.4rem;border-radius:0.75rem;padding:0.5rem 1rem;font-weight:600;font-size:0.875rem}`}</style>
    </div>
  );
}

/* ============ HERO TAB ============ */
function HeroTab({ settings, slides }: { settings: Record<string, string>; slides: any[] }) {
  const qc = useQueryClient();
  const saveB = useServerFn(saveSettingsBulk);
  const [form, setForm] = useState({
    hero_badge: settings[HOMEPAGE_KEYS.hero_badge] ?? "Bangladesh's #1 Digital Marketplace",
    hero_tagline: settings[HOMEPAGE_KEYS.hero_tagline] ?? "",
    hero_cta_primary: settings[HOMEPAGE_KEYS.hero_cta_primary] ?? "Shop Now",
    hero_cta_secondary: settings[HOMEPAGE_KEYS.hero_cta_secondary] ?? "আরও জানুন",
    hero_cta_secondary_link: settings[HOMEPAGE_KEYS.hero_cta_secondary_link] ?? "/dashboard",
    announcement_text: settings[HOMEPAGE_KEYS.announcement] ?? "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveB({ data: {
        items: Object.entries(form).map(([key, value]) => ({ key, value: String(value ?? ""), group_name: "hero" })),
      }});
      toast.success("✅ সফলভাবে সংরক্ষিত হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "homepage-cms"] });
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    } catch (e: any) { toast.error("❌ " + (e.message || "সমস্যা হয়েছে")); }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-bold text-lg">Hero টেক্সট</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><label className="text-xs text-muted-foreground">Hero Badge</label><input className="ip" value={form.hero_badge} onChange={(e) => setForm({...form, hero_badge: e.target.value})} /></div>
          <div><label className="text-xs text-muted-foreground">Announcement Bar</label><input className="ip" value={form.announcement_text} onChange={(e) => setForm({...form, announcement_text: e.target.value})} /></div>
          <div className="sm:col-span-2"><label className="text-xs text-muted-foreground">Tagline / Description</label><textarea className="ip" rows={3} value={form.hero_tagline} onChange={(e) => setForm({...form, hero_tagline: e.target.value})} /></div>
          <div><label className="text-xs text-muted-foreground">Primary CTA Text</label><input className="ip" value={form.hero_cta_primary} onChange={(e) => setForm({...form, hero_cta_primary: e.target.value})} /></div>
          <div></div>
          <div><label className="text-xs text-muted-foreground">Secondary CTA Text</label><input className="ip" placeholder="আরও জানুন" value={form.hero_cta_secondary} onChange={(e) => setForm({...form, hero_cta_secondary: e.target.value})} /></div>
          <div><label className="text-xs text-muted-foreground">Secondary CTA Link</label><input className="ip" placeholder="/dashboard বা https://..." value={form.hero_cta_secondary_link} onChange={(e) => setForm({...form, hero_cta_secondary_link: e.target.value})} /></div>
        </div>
        <button className="btn bg-gradient-brand text-primary-foreground shadow-glow"><Save className="h-4 w-4" /> Save</button>
      </form>
      <SlideCRUD kind="hero" slides={slides} title="Hero Slides (ব্যাকগ্রাউন্ড / নাভবার ইমেজ)" />
    </div>
  );
}

/* ============ OFFER TAB ============ */
function OfferTab({ slides }: { slides: any[] }) {
  return (
    <div className="space-y-4">
      <SlideCRUD kind="offer" slides={slides} title="Offer Banner (হোমপেজের উপরের ইমেজ)" />
    </div>
  );
}

/* ============ TRUST BAR TAB ============ */
const TRUST_ICONS = ["BadgeCheck", "ShieldCheck", "Headphones", "Zap", "Users", "Star", "Award", "Truck", "Lock", "Gift"];

function TrustTab({ settings }: { settings: Record<string, string> }) {
  const qc = useQueryClient();
  const saveB = useServerFn(saveSettingsBulk);
  const initial = useMemo<TrustItem[]>(() => {
    const parsed = parseTrustBar(settings[HOMEPAGE_KEYS.trust_bar]);
    return parsed.length > 0 ? parsed : [
      { icon: "BadgeCheck", label: "Best Quality", sub: "100% Authentic" },
      { icon: "ShieldCheck", label: "Secure Payments", sub: "Bkash • Nagad • Rocket" },
      { icon: "Zap", label: "Instant Delivery", sub: "অটো ডেলিভারি" },
    ];
  }, [settings]);
  const [items, setItems] = useState<TrustItem[]>(initial);

  const save = async () => {
    try {
      await saveB({ data: { items: [{ key: HOMEPAGE_KEYS.trust_bar, value: JSON.stringify(items), group_name: "homepage" }] }});
      toast.success("✅ সফলভাবে সংরক্ষিত হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "homepage-cms"] });
      qc.invalidateQueries({ queryKey: ["site_settings"] });
    } catch (e: any) { toast.error("❌ " + (e.message || "সমস্যা হয়েছে")); }
  };

  const update = (i: number, patch: Partial<TrustItem>) => setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () => setItems([...items, { icon: "BadgeCheck", label: "New Item", sub: "Subtitle" }]);

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">Trust Bar Items</h2>
        <div className="flex gap-2">
          <button onClick={add} className="btn glass-card"><Plus className="h-4 w-4" /> Add</button>
          <button onClick={save} className="btn bg-gradient-brand text-primary-foreground shadow-glow"><Save className="h-4 w-4" /> Save All</button>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <select className="ip col-span-3" value={it.icon} onChange={(e) => update(i, { icon: e.target.value })}>
              {TRUST_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
            </select>
            <input className="ip col-span-4" placeholder="Label" value={it.label} onChange={(e) => update(i, { label: e.target.value })} />
            <input className="ip col-span-4" placeholder="Sub" value={it.sub} onChange={(e) => update(i, { sub: e.target.value })} />
            <button onClick={() => remove(i)} className="col-span-1 rounded-xl border border-destructive/40 p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-muted-foreground">No items. Click Add.</div>}
      </div>
    </div>
  );
}

/* ============ REVIEW TAB ============ */
function ReviewTab({ slides }: { slides: any[] }) {
  return <SlideCRUD kind="review" slides={slides} title="Review Slides (কাস্টমার রিভিউ স্ক্রিনশট)" />;
}

/* Footer + Newsletter moved to /admin/footer and /admin/newsletter */



/* ============ Slide CRUD subcomponent ============ */
function SlideCRUD({ kind, slides, title }: { kind: "hero" | "offer" | "review"; slides: any[]; title: string }) {
  const qc = useQueryClient();
  const save = useServerFn(saveSlide);
  const del = useServerFn(deleteSlide);
  const [form, setForm] = useState({ id: "", image_url: "", link_url: "", alt_text: "", sort_order: 0, is_active: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url) {
      toast.error("❌ আগে একটা ছবি upload করুন");
      return;
    }
    try {
      await save({ data: {
        kind, id: form.id || undefined,
        image_url: form.image_url,
        link_url: form.link_url || null,
        alt_text: form.alt_text || null,
        sort_order: Number(form.sort_order) || 0,
        is_active: form.is_active,
      }});
      toast.success(form.id ? "✅ সফলভাবে আপডেট হয়েছে" : "✅ সফলভাবে যোগ হয়েছে");
      setForm({ id: "", image_url: "", link_url: "", alt_text: "", sort_order: 0, is_active: true });
      qc.invalidateQueries({ queryKey: ["admin", "homepage-cms"] });
      qc.invalidateQueries({ queryKey: ["offer_banner_first"] });
      qc.invalidateQueries({ queryKey: ["offer_slides_active"] });
      qc.invalidateQueries({ queryKey: ["review_slides"] });
    } catch (e: any) { toast.error("❌ " + (e.message || "সমস্যা হয়েছে")); }
  };
  const remove = async (id: string) => {
    if (!confirm("⚠️ আপনি কি নিশ্চিত? এই ছবিটি ডিলিট হয়ে যাবে।")) return;
    try { await del({ data: { kind, id } }); toast.success("✅ ডিলিট হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "homepage-cms"] }); qc.invalidateQueries({ queryKey: ["offer_slides_active"] }); }
    catch (e: any) { toast.error("❌ " + (e.message || "সমস্যা হয়েছে")); }
  };

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-lg">{title}</h2>
      <form onSubmit={submit} className="glass-card rounded-2xl p-5 grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <ImageUpload
            value={form.image_url}
            onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
            bucket={kind === "hero" ? "hero-slides" : kind === "offer" ? "offer-slides" : "admin-uploads"}
            folder={kind}
            label="Image *"
          />
        </div>
        {kind !== "review" && <>
          <input className="ip" placeholder="Link URL" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} />
          <input className="ip" placeholder="Alt text" value={form.alt_text} onChange={(e) => setForm({ ...form, alt_text: e.target.value })} />
        </>}
        <input className="ip" type="number" placeholder="Sort order" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active</label>
        <div className="sm:col-span-2"><button className="btn bg-gradient-brand text-primary-foreground shadow-glow">{form.id ? "আপডেট" : "যোগ করুন"}</button></div>
      </form>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {slides.map((s: any) => (
          <div key={s.id} className="glass-card rounded-2xl overflow-hidden">
            <div className="aspect-[16/9] bg-muted overflow-hidden">
              <img src={s.image_url} alt={s.alt_text ?? ""} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-3 flex items-center justify-between text-xs">
              <div className="font-semibold">#{s.sort_order} {s.is_active ? "" : "(off)"}</div>
              <div className="flex gap-1">
                <button onClick={() => setForm({ id: s.id, image_url: s.image_url, link_url: s.link_url ?? "", alt_text: s.alt_text ?? "", sort_order: s.sort_order ?? 0, is_active: s.is_active ?? true })} className="rounded-lg border border-border px-2 py-1">Edit</button>
                <button onClick={() => remove(s.id)} className="rounded-lg border border-destructive/40 px-2 py-1 text-destructive">×</button>
              </div>
            </div>
          </div>
        ))}
        {slides.length === 0 && <div className="text-sm text-muted-foreground">No slides yet.</div>}
      </div>
    </div>
  );
}
