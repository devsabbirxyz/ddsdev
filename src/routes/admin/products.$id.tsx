import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  getProductFull, saveProduct, deleteProduct,
  saveProductImage, deleteProductImage,
  saveVariant, deleteVariant,
  addProductAccounts, deleteProductAccount,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import {
  ArrowLeft, Save, Trash2, Plus, Star, ImagePlus,
  Package, Image as ImageIcon, Layers, Database, Search,
} from "lucide-react";

export const Route = createFileRoute("/admin/products/$id")({
  head: () => ({ meta: [{ title: "Edit Product — Admin" }, { name: "robots", content: "noindex" }] }),
  component: ProductEditor,
});

type Tab = "basic" | "media" | "variants" | "delivery" | "seo";

const DELIVERY_OPTIONS: { value: string; label: string; desc: string }[] = [
  { value: "instant_text", label: "ইন্সট্যান্ট টেক্সট", desc: "পেমেন্টের পর সাথে সাথে টেক্সট/লাইসেন্স কী চলে যাবে।" },
  { value: "account", label: "অ্যাকাউন্ট ডেলিভারি", desc: "প্রি-আপলোড করা ইউজারনেম/পাসওয়ার্ড স্টক থেকে অটো-ডেলিভারি।" },
  { value: "invite_link", label: "ইনভাইট লিংক", desc: "একটি লিংক/জয়েন কোড পাঠানো হবে (Telegram/Discord/Drive)।" },
  { value: "subscription", label: "সাবস্ক্রিপশন", desc: "ক্রেতার কাছ থেকে অতিরিক্ত ইনপুট নিয়ে ম্যানুয়ালি সেট-আপ।" },
  { value: "manual", label: "ম্যানুয়াল ডেলিভারি", desc: "অ্যাডমিন ম্যানুয়ালি অর্ডার প্রসেস করে ডেলিভারি দেবে।" },
];

function ProductEditor() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("basic");

  const getFull = useServerFn(getProductFull);
  const save = useServerFn(saveProduct);
  const del = useServerFn(deleteProduct);

  const productQ = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => getFull({ data: { id } }),
  });

  const catsQ = useQuery({
    queryKey: ["admin", "all-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name").order("sort_order");
      return data ?? [];
    },
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (productQ.data?.product && !form) setForm(productQ.data.product);
  }, [productQ.data, form]);

  if (productQ.isLoading || !productQ.data || !form) {
    return <div className="text-muted-foreground">লোড হচ্ছে...</div>;
  }
  const { images, variants, accounts } = productQ.data;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const onSave = async () => {
    try {
      await save({
        data: {
          id,
          title: form.title,
          title_en: form.title_en,
          slug: form.slug,
          category_id: form.category_id,
          short_description: form.short_description,
          short_description_en: form.short_description_en,
          long_description: form.long_description,
          long_description_en: form.long_description_en,
          regular_price: form.regular_price != null ? Number(form.regular_price) : null,
          offer_price: form.offer_price != null ? Number(form.offer_price) : null,
          delivery_type: form.delivery_type,
          delivery_content: form.delivery_content,
          subscription_input_label: form.subscription_input_label,
          subscription_input_label_en: form.subscription_input_label_en,
          video_url: form.video_url,
          seo_title: form.seo_title,
          seo_description: form.seo_description,
          is_variant: form.is_variant,
          is_active: form.is_active,
          is_featured: form.is_featured,
          is_new_arrival: form.is_new_arrival,
          is_best_seller: form.is_best_seller,
          status: form.status,
        },
      });
      toast.success("সেভ হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "product", id] });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const onDelete = async () => {
    if (!confirm("পুরো প্রোডাক্ট ডিলিট হবে। নিশ্চিত?")) return;
    try {
      await del({ data: { id } });
      toast.success("ডিলিট হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      nav({ to: "/admin/products" });
    } catch (e: any) { toast.error(e.message); }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "basic", label: "মূল তথ্য", icon: Package },
    { key: "media", label: "ছবি", icon: ImageIcon },
    { key: "variants", label: "ভ্যারিয়েন্ট", icon: Layers },
    { key: "delivery", label: "ডেলিভারি", icon: Database },
    { key: "seo", label: "SEO", icon: Search },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="glass-card rounded-xl p-2 hover:bg-accent">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-xl">{form.title || "প্রোডাক্ট ইডিট"}</h1>
            <div className="text-xs text-muted-foreground font-mono">/{form.slug}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onDelete} className="rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 px-3 py-2 text-sm font-bold inline-flex items-center gap-2">
            <Trash2 className="h-4 w-4" /> ডিলিট
          </button>
          <button onClick={onSave} className="rounded-xl bg-gradient-brand text-primary-foreground shadow-glow px-4 py-2 text-sm font-bold inline-flex items-center gap-2">
            <Save className="h-4 w-4" /> সেভ
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-sm font-semibold inline-flex items-center gap-2 border-b-2 transition whitespace-nowrap ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "basic" && (
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-5 space-y-4 lg:col-span-2">
            <Field label="শিরোনাম (বাংলা)" value={form.title} onChange={(v) => set("title", v)} />
            <Field label="Title (English)" value={form.title_en} onChange={(v) => set("title_en", v)} />
            <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} mono />
            <div>
              <label className="text-sm font-medium mb-1.5 block">ক্যাটাগরি</label>
              <select value={form.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                <option value="">-- কোনোটি না --</option>
                {(catsQ.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <Field label="শর্ট ডেসক্রিপশন (বাংলা)" value={form.short_description} onChange={(v) => set("short_description", v)} textarea />
            <Field label="Short Description (English)" value={form.short_description_en} onChange={(v) => set("short_description_en", v)} textarea />
            <Field label="বিস্তারিত বিবরণ (বাংলা)" value={form.long_description} onChange={(v) => set("long_description", v)} textarea rows={6} />
            <Field label="Long Description (English)" value={form.long_description_en} onChange={(v) => set("long_description_en", v)} textarea rows={6} />
            <Field label="ভিডিও URL (YouTube/Vimeo)" value={form.video_url} onChange={(v) => set("video_url", v)} />
          </div>

          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="font-bold">মূল্য</h3>
              <Field label="রেগুলার প্রাইস (৳)" type="number" value={form.regular_price ?? ""} onChange={(v) => set("regular_price", v)} />
              <Field label="অফার প্রাইস (৳)" type="number" value={form.offer_price ?? ""} onChange={(v) => set("offer_price", v)} />
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3">
              <h3 className="font-bold">স্ট্যাটাস</h3>
              <Toggle label="অ্যাক্টিভ (লাইভ)" checked={!!form.is_active} onChange={(v) => set("is_active", v)} />
              <Toggle label="ফিচার্ড প্রোডাক্ট" checked={!!form.is_featured} onChange={(v) => set("is_featured", v)} icon={<Star className="h-3.5 w-3.5 text-yellow-500" />} />
              <Toggle label="বেস্ট সেলার" checked={!!form.is_best_seller} onChange={(v) => set("is_best_seller", v)} />
              <Toggle label="নিউ অ্যারাইভাল" checked={!!form.is_new_arrival} onChange={(v) => set("is_new_arrival", v)} />
              <Toggle label="ভ্যারিয়েন্ট আছে" checked={!!form.is_variant} onChange={(v) => set("is_variant", v)} />
              <div>
                <label className="text-sm font-medium mb-1.5 block">অ্যাপ্রুভাল স্ট্যাটাস</label>
                <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "media" && <MediaTab productId={id} images={images} onChange={() => qc.invalidateQueries({ queryKey: ["admin", "product", id] })} />}
      {tab === "variants" && <VariantsTab productId={id} variants={variants} onChange={() => qc.invalidateQueries({ queryKey: ["admin", "product", id] })} />}
      {tab === "delivery" && (
        <DeliveryTab
          form={form} set={set}
          productId={id} variants={variants} accounts={accounts}
          onChange={() => qc.invalidateQueries({ queryKey: ["admin", "product", id] })}
        />
      )}
      {tab === "seo" && (
        <div className="glass-card rounded-2xl p-5 space-y-4 max-w-2xl">
          <Field label="SEO Title" value={form.seo_title} onChange={(v) => set("seo_title", v)} />
          <Field label="SEO Description" value={form.seo_description} onChange={(v) => set("seo_description", v)} textarea />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea = false, rows = 3, mono = false }: {
  label: string; value: any; onChange: (v: any) => void;
  type?: string; textarea?: boolean; rows?: number; mono?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      {textarea ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
      ) : (
        <input type={type} value={value ?? ""} onChange={(e) => onChange(type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)} className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-sm ${mono ? "font-mono" : ""}`} />
      )}
    </div>
  );
}

function Toggle({ label, checked, onChange, icon }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer">
      <span className="text-sm font-medium inline-flex items-center gap-2">{icon}{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-9 appearance-none rounded-full bg-muted checked:bg-primary relative transition cursor-pointer before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4" />
    </label>
  );
}


function MediaTab({ productId, images, onChange }: any) {
  const addImg = useServerFn(saveProductImage);
  const delImg = useServerFn(deleteProductImage);
  const [url, setUrl] = useState("");
  const [main, setMain] = useState(false);
  const [uploading, setUploading] = useState(false);

  const add = async () => {
    if (!url.trim()) return;
    try {
      await addImg({ data: { product_id: productId, image_url: url.trim(), is_main: main, sort_order: images.length } });
      setUrl(""); setMain(false); onChange();
      toast.success("ছবি যোগ হয়েছে");
    } catch (e: any) { toast.error(e.message); }
  };

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      let added = 0;
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name}: ১০MB এর বেশি`); continue; }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
          cacheControl: "3600", upsert: false, contentType: file.type,
        });
        if (upErr) { toast.error(`আপলোড ফেইল: ${upErr.message}`); continue; }
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        await addImg({ data: { product_id: productId, image_url: pub.publicUrl, is_main: images.length + added === 0, sort_order: images.length + added } });
        added++;
      }
      if (added > 0) { toast.success(`${added} টি ছবি যোগ হয়েছে`); onChange(); }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = async (id: string) => {
    if (!confirm("ডিলিট?")) return;
    try { await delImg({ data: { id } }); onChange(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="font-bold inline-flex items-center gap-2"><ImagePlus className="h-4 w-4" /> ছবি আপলোড করুন</h3>
        <label className={`block rounded-2xl border-2 border-dashed border-border hover:border-primary/60 transition cursor-pointer p-6 text-center ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
          <input type="file" accept="image/*" multiple onChange={onFileUpload} disabled={uploading} className="hidden" />
          <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <div className="text-sm font-semibold">{uploading ? "আপলোড হচ্ছে..." : "ক্লিক করে ছবি বাছাই করুন (একাধিক সাপোর্ট করে)"}</div>
          <div className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP — সর্বোচ্চ ১০MB প্রতি ছবি</div>
        </label>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">অথবা URL দিন</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://image-url.jpg" className="flex-1 min-w-[260px] rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={main} onChange={(e) => setMain(e.target.checked)} /> মেইন</label>
          <button onClick={add} className="rounded-xl bg-gradient-brand text-primary-foreground px-4 py-2 text-sm font-bold inline-flex items-center gap-2"><Plus className="h-4 w-4" /> অ্যাড</button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">কোনো ছবি নেই।</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((img: any) => (
            <div key={img.id} className="glass-card rounded-2xl overflow-hidden group relative">
              <img src={img.image_url} alt="" className="w-full h-40 object-cover" />
              {img.is_main && <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">MAIN</span>}
              <button onClick={() => remove(img.id)} className="absolute top-2 right-2 rounded-full bg-destructive/90 text-white p-1.5 opacity-0 group-hover:opacity-100 transition">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantsTab({ productId, variants, onChange }: any) {
  const save = useServerFn(saveVariant);
  const del = useServerFn(deleteVariant);
  const [form, setForm] = useState({ label: "", label_en: "", regular_price: "", offer_price: "" });

  const add = async () => {
    if (!form.label || !form.regular_price) return toast.error("Label ও Regular price দিন");
    try {
      await save({
        data: {
          product_id: productId,
          label: form.label,
          label_en: form.label_en || null,
          regular_price: Number(form.regular_price),
          offer_price: form.offer_price ? Number(form.offer_price) : null,
          sort_order: variants.length,
        },
      });
      setForm({ label: "", label_en: "", regular_price: "", offer_price: "" });
      onChange();
      toast.success("ভ্যারিয়েন্ট যোগ হয়েছে");
    } catch (e: any) { toast.error(e.message); }
  };

  const remove = async (id: string) => {
    if (!confirm("ডিলিট?")) return;
    try { await del({ data: { id } }); onChange(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="font-bold">নতুন ভ্যারিয়েন্ট</h3>
        <div className="grid md:grid-cols-4 gap-2">
          <input placeholder="Label (e.g. 1 মাস)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Label English" value={form.label_en} onChange={(e) => setForm({ ...form, label_en: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Regular ৳" type="number" value={form.regular_price} onChange={(e) => setForm({ ...form, regular_price: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          <input placeholder="Offer ৳" type="number" value={form.offer_price} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} className="rounded-xl border border-border bg-background px-3 py-2 text-sm" />
        </div>
        <button onClick={add} className="rounded-xl bg-gradient-brand text-primary-foreground px-4 py-2 text-sm font-bold inline-flex items-center gap-2"><Plus className="h-4 w-4" /> অ্যাড</button>
      </div>

      {variants.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">কোনো ভ্যারিয়েন্ট নেই।</div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr>
              <th className="text-left px-4 py-3">Label</th>
              <th className="text-left px-4 py-3">Regular</th>
              <th className="text-left px-4 py-3">Offer</th>
              <th className="text-right px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {variants.map((v: any) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{v.label} {v.label_en && <span className="text-xs text-muted-foreground">({v.label_en})</span>}</td>
                  <td className="px-4 py-3">৳{v.regular_price}</td>
                  <td className="px-4 py-3">{v.offer_price ? `৳${v.offer_price}` : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(v.id)} className="rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 px-2.5 py-1.5 text-xs font-bold"><Trash2 className="h-3 w-3" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DeliveryTab({ form, set, productId, variants, accounts, onChange }: any) {
  const addAccts = useServerFn(addProductAccounts);
  const delAcct = useServerFn(deleteProductAccount);
  const [bulk, setBulk] = useState("");
  const [variantId, setVariantId] = useState<string>("");

  const importAccounts = async () => {
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return toast.error("কোনো লাইন নেই");
    const items = lines.map((line) => {
      const [username, password, ...rest] = line.split("|").map((s) => s.trim());
      return { username: username || null, password: password || null, extra_info: rest.length ? rest.join(" | ") : null };
    });
    try {
      const r = await addAccts({ data: { product_id: productId, variant_id: variantId || null, accounts: items } });
      toast.success(`${r.count} টি অ্যাকাউন্ট যোগ হয়েছে`);
      setBulk("");
      onChange();
    } catch (e: any) { toast.error(e.message); }
  };

  const removeAcct = async (id: string) => {
    if (!confirm("ডিলিট?")) return;
    try { await delAcct({ data: { id } }); onChange(); } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="font-bold">ডেলিভারি টাইপ</h3>
        <div className="grid md:grid-cols-2 gap-2">
          {DELIVERY_OPTIONS.map((d) => (
            <label key={d.value} className={`rounded-2xl border-2 p-4 cursor-pointer transition ${form.delivery_type === d.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
              <input type="radio" className="sr-only" name="dtype" checked={form.delivery_type === d.value} onChange={() => set("delivery_type", d.value)} />
              <div className="font-bold text-sm mb-1">{d.label}</div>
              <div className="text-xs text-muted-foreground">{d.desc}</div>
            </label>
          ))}
        </div>
      </div>

      {(form.delivery_type === "instant_text" || form.delivery_type === "invite_link" || form.delivery_type === "manual") && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold">
            {form.delivery_type === "invite_link" ? "ইনভাইট লিংক / জয়েন কোড" : form.delivery_type === "manual" ? "ম্যানুয়াল ইনস্ট্রাকশন (অ্যাডমিনের জন্য)" : "ডেলিভারি কন্টেন্ট (টেক্সট/কী)"}
          </h3>
          <textarea value={form.delivery_content ?? ""} onChange={(e) => set("delivery_content", e.target.value)} rows={5} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono" placeholder={form.delivery_type === "invite_link" ? "https://t.me/joinchat/..." : "লাইসেন্স কী বা টেক্সট..."} />
          <p className="text-xs text-muted-foreground">এই কন্টেন্ট অর্ডার অ্যাপ্রুভ হওয়ার পর কাস্টমারকে দেখানো হবে।</p>
        </div>
      )}

      {form.delivery_type === "subscription" && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="font-bold">ক্রেতার ইনপুট লেবেল</h3>
          <Field label="ইনপুট লেবেল (বাংলা)" value={form.subscription_input_label} onChange={(v: any) => set("subscription_input_label", v)} />
          <Field label="Input Label (English)" value={form.subscription_input_label_en} onChange={(v: any) => set("subscription_input_label_en", v)} />
          <p className="text-xs text-muted-foreground">যেমন: "আপনার Gmail / Netflix ইমেইল"</p>
        </div>
      )}

      {form.delivery_type === "account" && (
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="font-bold">অ্যাকাউন্ট স্টক</h3>
          <div className="text-sm">
            মোট: <b>{accounts.length}</b> • উপলভ্য: <b className="text-emerald-600">{accounts.filter((a: any) => !a.is_sold).length}</b> • বিক্রিত: <b className="text-muted-foreground">{accounts.filter((a: any) => a.is_sold).length}</b>
          </div>
          <div className="space-y-2">
            {variants.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">কোন ভ্যারিয়েন্টের জন্য?</label>
                <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                  <option value="">যেকোনো</option>
                  {variants.map((v: any) => <option key={v.id} value={v.id}>{v.label}</option>)}
                </select>
              </div>
            )}
            <label className="text-sm font-medium block">বাল্ক ইম্পোর্ট (প্রতি লাইনে: <code className="text-xs">username|password|extra</code>)</label>
            <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={6} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono" placeholder="user1@mail.com|password123&#10;user2@mail.com|password456|expires 2026" />
            <button onClick={importAccounts} className="rounded-xl bg-gradient-brand text-primary-foreground px-4 py-2 text-sm font-bold inline-flex items-center gap-2"><Plus className="h-4 w-4" /> ইম্পোর্ট</button>
          </div>

          {accounts.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr>
                  <th className="text-left px-4 py-2">Username</th>
                  <th className="text-left px-4 py-2">Extra</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2"></th>
                </tr></thead>
                <tbody>
                  {accounts.slice(0, 50).map((a: any) => (
                    <tr key={a.id} className="border-t border-border">
                      <td className="px-4 py-2 font-mono text-xs">{a.username}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{a.extra_info}</td>
                      <td className="px-4 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.is_sold ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-600"}`}>{a.is_sold ? "SOLD" : "AVAILABLE"}</span></td>
                      <td className="px-4 py-2 text-right">
                        {!a.is_sold && <button onClick={() => removeAcct(a.id)} className="text-destructive text-xs"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
