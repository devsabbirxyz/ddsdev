import { useEffect, useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const popupQuery = queryOptions({
  queryKey: ["popup_settings_active"],
  staleTime: 60_000,
  queryFn: async () => {
    const { data } = await supabase
      .from("popup_settings")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },
});

const KEY = "dds_popup_seen_v1";

export function OfferPopup() {
  const { lang } = useI18n();
  const { data: p } = useQuery(popupQuery);
  const [open, setOpen] = useState(false);
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!p) return;
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw === p.id) return;
      const days = Number(p.repeat_after_days ?? 3);
      const lastSeen = localStorage.getItem(`${KEY}_${p.id}`);
      if (lastSeen && Date.now() - Number(lastSeen) < days * 86400_000) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), Math.max(0, (p.show_delay_seconds ?? 5) * 1000));
    return () => clearTimeout(t);
  }, [p]);

  useEffect(() => {
    if (!open || !p?.show_timer) return;
    const end = Date.now() + (p.timer_minutes ?? 30) * 60_000;
    const tick = () => setRemaining(Math.max(0, end - Date.now()));
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, [open, p]);

  if (!open || !p) return null;

  const heading = (lang === "en" ? p.heading_en : p.heading) || p.heading || "Special Offer";
  const sub = (lang === "en" ? p.sub_text_en : p.sub_text) || p.sub_text || "";
  const btnText = (lang === "en" ? p.button_text_en : p.button_text) || p.button_text || "Shop Now";

  const close = () => {
    setOpen(false);
    try {
      sessionStorage.setItem(KEY, p.id);
      localStorage.setItem(`${KEY}_${p.id}`, String(Date.now()));
    } catch {}
  };

  const mm = Math.floor(remaining / 60_000);
  const ss = Math.floor((remaining % 60_000) / 1000);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in"
      onClick={close}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-2xl border border-border animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur border border-border hover:bg-accent transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {p.image_url && (
          <img src={p.image_url} alt="" className="w-full h-48 object-cover" />
        )}

        <div className="p-6 text-center space-y-3">
          <h2 className="font-display font-bold text-2xl text-gradient-brand">{heading}</h2>
          {sub && <p className="text-sm text-muted-foreground">{sub}</p>}

          {p.coupon_code && (
            <div className="rounded-xl bg-gradient-brand/10 border border-primary/30 py-3 px-4">
              <div className="text-xs text-muted-foreground">কুপন কোড</div>
              <div className="font-display font-bold text-xl tracking-wider text-primary">{p.coupon_code}</div>
            </div>
          )}

          {p.show_timer && remaining > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full bg-destructive/10 text-destructive px-4 py-1.5 text-sm font-bold">
              <Clock className="h-4 w-4" />
              {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
            </div>
          )}

          <a
            href={p.button_link || "/shop"}
            onClick={close}
            className="block w-full rounded-2xl bg-gradient-brand text-primary-foreground py-3 font-bold shadow-glow hover:scale-[1.02] transition"
          >
            {btnText}
          </a>
        </div>
      </div>
    </div>
  );
}
