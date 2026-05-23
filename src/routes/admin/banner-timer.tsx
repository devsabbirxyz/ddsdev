import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Timer } from "lucide-react";

export const Route = createFileRoute("/admin/banner-timer")({
  head: () => ({ meta: [{ title: "Countdown Banner — Admin" }, { name: "robots", content: "noindex" }] }),
  component: BannerTimerAdmin,
});

function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function BannerTimerAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "offer_banner_timer"],
    queryFn: async () => {
      const { data } = await supabase
        .from("offer_banner_timer")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (!form) {
      setForm(
        data ?? {
          is_active: false,
          end_time: new Date(Date.now() + 86400_000).toISOString(),
          end_message: "অফার শেষ হয়ে গেছে",
          end_message_en: "Offer has ended",
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
        end_time: new Date(form.end_time).toISOString(),
        end_message: form.end_message || "অফার শেষ হয়ে গেছে",
        end_message_en: form.end_message_en || "Offer has ended",
      };
      if (form.id) {
        const { error } = await supabase.from("offer_banner_timer").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { data: ins, error } = await supabase.from("offer_banner_timer").insert(payload).select("id").maybeSingle();
        if (error) throw error;
        if (ins) setForm((f: any) => ({ ...f, id: ins.id }));
      }
      toast.success("✅ সফলভাবে সংরক্ষিত হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "offer_banner_timer"] });
      qc.invalidateQueries({ queryKey: ["offer_banner_timer_active"] });
    } catch (e: any) {
      toast.error(`❌ ${e.message || "সমস্যা হয়েছে"}`);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl inline-flex items-center gap-2">
            <Timer className="h-6 w-6 text-primary" /> Countdown Banner
          </h1>
          <p className="text-sm text-muted-foreground mt-1">হোমপেজে উপরে কাউন্টডাউন ব্যানার দেখানো হবে।</p>
        </div>
        <button onClick={save} className="rounded-xl bg-gradient-brand text-primary-foreground shadow-glow px-5 py-2.5 text-sm font-bold inline-flex items-center gap-2">
          <Save className="h-4 w-4" /> সেভ
        </button>
      </div>

      <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <div className="font-bold">ব্যানার চালু করুন</div>
          <div className="text-xs text-muted-foreground mt-0.5">বন্ধ থাকলে হোমপেজে ব্যানার দেখানো হবে না।</div>
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
        <div>
          <label className="text-sm font-medium mb-1.5 block">অফার শেষ হওয়ার সময়</label>
          <input
            type="datetime-local"
            value={toLocalInput(form.end_time)}
            onChange={(e) => set("end_time", new Date(e.target.value).toISOString())}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">শেষ হওয়ার মেসেজ (বাংলা)</label>
            <input
              type="text"
              value={form.end_message ?? ""}
              onChange={(e) => set("end_message", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">End Message (English)</label>
            <input
              type="text"
              value={form.end_message_en ?? ""}
              onChange={(e) => set("end_message_en", e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
