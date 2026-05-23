import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Sparkles } from "lucide-react";
import { ImageUpload } from "@/components/admin/ImageUpload";

export const Route = createFileRoute("/admin/popup")({
  head: () => ({ meta: [{ title: "Offer Popup — Admin" }, { name: "robots", content: "noindex" }] }),
  component: PopupAdmin,
});

function PopupAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "popup_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("popup_settings").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (!form) {
      setForm(
        data ?? {
          is_active: false,
          heading: "বিশেষ অফার!",
          heading_en: "Special Offer!",
          sub_text: "আজই কিনুন এবং বিশেষ ছাড় উপভোগ করুন।",
          sub_text_en: "Buy today and enjoy special discount.",
          button_text: "এখনই Shop করুন",
          button_text_en: "Shop Now",
          button_link: "/shop",
          image_url: "",
          coupon_code: "",
          show_timer: true,
          timer_minutes: 30,
          show_delay_seconds: 5,
          repeat_after_days: 3,
          show_on: "all",
        }
      );
    }
  }, [data, form]);

  if (isLoading || !form) return <div className="text-muted-foreground">লোড হচ্ছে...</div>;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    try {
      const payload = {
        is_active: !!form.is_active,
        heading: form.heading,
        heading_en: form.heading_en,
        sub_text: form.sub_text,
        sub_text_en: form.sub_text_en,
        button_text: form.button_text,
        button_text_en: form.button_text_en,
        button_link: form.button_link || "/shop",
        image_url: form.image_url || null,
        coupon_code: form.coupon_code || null,
        show_timer: !!form.show_timer,
        timer_minutes: Number(form.timer_minutes ?? 30),
        show_delay_seconds: Number(form.show_delay_seconds ?? 5),
        repeat_after_days: Number(form.repeat_after_days ?? 3),
        show_on: form.show_on || "all",
      };
      if (form.id) {
        const { error } = await supabase.from("popup_settings").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { data: ins, error } = await supabase.from("popup_settings").insert(payload).select("id").maybeSingle();
        if (error) throw error;
        if (ins) setForm((f: any) => ({ ...f, id: ins.id }));
      }
      toast.success("✅ সফলভাবে সংরক্ষিত হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "popup_settings"] });
      qc.invalidateQueries({ queryKey: ["popup_settings_active"] });
    } catch (e: any) {
      toast.error(`❌ ${e.message || "সমস্যা হয়েছে"}`);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl inline-flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Offer Popup
          </h1>
          <p className="text-sm text-muted-foreground mt-1">হোমপেজে ভিজিটরদের দেখানো হবে এমন পপ-আপ।</p>
        </div>
        <button onClick={save} className="rounded-xl bg-gradient-brand text-primary-foreground shadow-glow px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2">
          <Save className="h-4 w-4" /> সেভ
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="font-bold">পপ-আপ চালু করুন</div>
          <div className="text-xs text-muted-foreground mt-0.5">বন্ধ থাকলে সাইটে কোনো পপ-আপ দেখানো হবে না।</div>
        </div>
        <label className="cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
            className="h-7 w-12 appearance-none rounded-full bg-muted checked:bg-primary relative transition cursor-pointer before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-6 before:w-6 before:rounded-full before:bg-white before:transition checked:before:translate-x-5"
          />
        </label>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">কন্টেন্ট</h3>
        <ImageUpload value={form.image_url || ""} onChange={(v) => set("image_url", v)} bucket="admin-uploads" folder="popup" label="পপ-আপ ছবি" />
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="হেডিং (বাংলা)" value={form.heading} onChange={(v) => set("heading", v)} />
          <Field label="Heading (English)" value={form.heading_en} onChange={(v) => set("heading_en", v)} />
          <Field label="সাব টেক্সট (বাংলা)" value={form.sub_text} onChange={(v) => set("sub_text", v)} textarea />
          <Field label="Sub Text (English)" value={form.sub_text_en} onChange={(v) => set("sub_text_en", v)} textarea />
        </div>
        <Field label="কুপন কোড (অপশনাল)" value={form.coupon_code} onChange={(v) => set("coupon_code", v)} placeholder="DDS15" />
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">বাটন</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="বাটন টেক্সট (বাংলা)" value={form.button_text} onChange={(v) => set("button_text", v)} />
          <Field label="Button Text (English)" value={form.button_text_en} onChange={(v) => set("button_text_en", v)} />
        </div>
        <Field label="বাটন লিংক" value={form.button_link} onChange={(v) => set("button_link", v)} placeholder="/shop" />
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-bold">টাইমার ও আচরণ</h3>
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm font-medium">টাইমার দেখান (Countdown)</span>
          <input
            type="checkbox"
            checked={!!form.show_timer}
            onChange={(e) => set("show_timer", e.target.checked)}
            className="h-5 w-9 appearance-none rounded-full bg-muted checked:bg-primary relative cursor-pointer before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition checked:before:translate-x-4"
          />
        </label>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="টাইমার (মিনিট)" type="number" value={form.timer_minutes} onChange={(v) => set("timer_minutes", v)} />
          <Field label="দেখানোর Delay (সেকেন্ড)" type="number" value={form.show_delay_seconds} onChange={(v) => set("show_delay_seconds", v)} />
          <Field label="পুনরায় দেখান (দিন পর)" type="number" value={form.repeat_after_days} onChange={(v) => set("repeat_after_days", v)} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", textarea = false, placeholder }: any) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      {textarea ? (
        <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={2} placeholder={placeholder} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
      ) : (
        <input type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
      )}
    </div>
  );
}
