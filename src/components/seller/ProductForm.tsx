import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveProduct } from "@/lib/seller.functions";
import { toast } from "sonner";
import { successDialog } from "@/components/ui/modal-dialogs";

const categoriesQuery = queryOptions({
  queryKey: ["all-categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("id,name").eq("is_active", true).order("sort_order");
    if (error) throw error;
    return data ?? [];
  },
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09FF\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || `p-${Date.now()}`;
}

type Initial = {
  id?: string;
  title?: string;
  slug?: string | null;
  title_en?: string | null;
  short_description?: string | null;
  long_description?: string | null;
  category_id?: string | null;
  regular_price?: number;
  offer_price?: number | null;
  delivery_type?: string;
  delivery_content?: string | null;
  is_variant?: boolean;
  is_active?: boolean;
};

export function ProductForm({ initial }: { initial?: Initial }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const save = useServerFn(saveProduct);
  const { data: categories = [] } = useQuery(categoriesQuery);

  const [form, setForm] = useState({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    title_en: initial?.title_en ?? "",
    short_description: initial?.short_description ?? "",
    long_description: initial?.long_description ?? "",
    category_id: initial?.category_id ?? "",
    regular_price: String(initial?.regular_price ?? ""),
    offer_price: initial?.offer_price != null ? String(initial.offer_price) : "",
    delivery_type: (initial?.delivery_type as any) ?? "downloadable",
    delivery_content: initial?.delivery_content ?? "",
    is_active: initial?.is_active ?? true,
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);

  const update = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const reg = Number(form.regular_price);
      if (!form.title.trim() || isNaN(reg) || reg <= 0) {
        toast.error("Title এবং Regular Price আবশ্যক");
        return;
      }
      const res = await save({
        data: {
          id: initial?.id,
          title: form.title.trim(),
          slug: form.slug || null,
          title_en: form.title_en || null,
          short_description: form.short_description || null,
          long_description: form.long_description || null,
          category_id: form.category_id || null,
          regular_price: reg,
          offer_price: form.offer_price ? Number(form.offer_price) : null,
          delivery_type: form.delivery_type as any,
          delivery_content: form.delivery_content || null,
          is_active: form.is_active,
        },
      });
      qc.invalidateQueries({ queryKey: ["seller", "my-products"] });
      if (initial?.id) {
        toast.success("আপডেট হয়েছে");
        if (res?.id) nav({ to: "/seller/products" });
      } else {
        await successDialog({
          title: "প্রোডাক্ট যোগ সফল হয়েছে!",
          description: "আপনার প্রোডাক্টটি সফলভাবে যোগ করা হয়েছে — admin approval-এর অপেক্ষায় আছে।",
        });
        if (res?.id) nav({ to: "/seller/products" });
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-3xl">
      <h1 className="font-display font-bold text-2xl">{initial?.id ? "প্রোডাক্ট এডিট" : "নতুন প্রোডাক্ট"}</h1>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <Field label="টাইটেল (বাংলা)">
          <input className="ip" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </Field>
        <Field label="Title (English)">
          <input className="ip" value={form.title_en} onChange={(e) => update("title_en", e.target.value)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="ক্যাটাগরি">
            <select className="ip" value={form.category_id} onChange={(e) => update("category_id", e.target.value)}>
              <option value="">— নির্বাচন করুন —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="ডেলিভারি টাইপ">
            <select className="ip" value={form.delivery_type} onChange={(e) => update("delivery_type", e.target.value)}>
              <option value="downloadable">Downloadable</option>
              <option value="account">Account (pool)</option>
              <option value="subscription">Subscription</option>
              <option value="method">Method</option>
              <option value="text_link">Text/Link</option>
            </select>
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Regular Price (৳)">
            <input type="number" min="0" step="0.01" className="ip" value={form.regular_price} onChange={(e) => update("regular_price", e.target.value)} required />
          </Field>
          <Field label="Offer Price (৳)">
            <input type="number" min="0" step="0.01" className="ip" value={form.offer_price} onChange={(e) => update("offer_price", e.target.value)} />
          </Field>
        </div>
        <Field label="শর্ট ডেসক্রিপশন">
          <textarea className="ip min-h-[80px]" value={form.short_description} onChange={(e) => update("short_description", e.target.value)} />
        </Field>
        <Field label="ডিটেইলস">
          <textarea className="ip min-h-[140px]" value={form.long_description} onChange={(e) => update("long_description", e.target.value)} />
        </Field>
        <Field label="ডেলিভারি কন্টেন্ট (Auto delivery এর জন্য)">
          <textarea className="ip min-h-[100px] font-mono text-xs" value={form.delivery_content} onChange={(e) => update("delivery_content", e.target.value)} placeholder="Download link / instructions / method..." />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} /> Active
        </label>
      </div>

      <button disabled={busy} type="submit" className="rounded-xl bg-gradient-brand px-6 py-3 font-bold text-primary-foreground shadow-glow disabled:opacity-50">
        {busy ? "Saving..." : initial?.id ? "আপডেট সেভ করুন" : "প্রোডাক্ট তৈরি করুন"}
      </button>

      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.6rem 0.8rem;font-size:0.875rem}`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold mb-1 text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
