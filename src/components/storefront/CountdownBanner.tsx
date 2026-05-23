import { useEffect, useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Clock, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const bannerTimerQuery = queryOptions({
  queryKey: ["offer_banner_timer_active"],
  staleTime: 60_000,
  queryFn: async () => {
    const { data } = await supabase
      .from("offer_banner_timer")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  },
});

const KEY = "dds_banner_timer_closed";

export function CountdownBanner() {
  const { lang } = useI18n();
  const { data: t } = useQuery(bannerTimerQuery);
  const [now, setNow] = useState(() => Date.now());
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!t) return;
    try {
      if (sessionStorage.getItem(KEY) === t.id) setClosed(true);
    } catch {}
  }, [t]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!t || closed) return null;

  const end = new Date(t.end_time).getTime();
  const remaining = end - now;
  const ended = remaining <= 0;

  if (ended) {
    const msg = (lang === "en" ? t.end_message_en : t.end_message) || "Offer has ended";
    return (
      <div className="bg-muted text-muted-foreground text-center text-xs sm:text-sm py-2 px-4 font-medium">
        {msg}
      </div>
    );
  }

  const total = Math.floor(remaining / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const close = () => {
    setClosed(true);
    try { sessionStorage.setItem(KEY, t.id); } catch {}
  };

  return (
    <div className="relative bg-gradient-to-r from-destructive via-primary to-secondary text-primary-foreground text-center text-xs sm:text-sm py-2 px-10 font-medium flex items-center justify-center gap-2">
      <Clock className="h-3.5 w-3.5 shrink-0" />
      <span className="font-bold">
        {lang === "en" ? "Offer ends in:" : "অফার শেষ হবে:"}
      </span>
      <span className="font-mono font-bold tabular-nums">
        {d > 0 && `${d}d `}
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
      <button
        onClick={close}
        aria-label="Close"
        className="absolute right-2 top-1/2 -translate-y-1/2 grid h-6 w-6 place-items-center rounded-full hover:bg-white/20 transition"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
