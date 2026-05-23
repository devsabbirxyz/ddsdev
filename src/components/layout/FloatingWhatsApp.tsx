import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { siteSettingsQuery } from "@/lib/site-settings";

export function FloatingWhatsApp() {
  const { data: s } = useQuery(siteSettingsQuery);
  const enabled = (s?.whatsapp_button_enabled ?? "1") === "1";
  const wa = (s?.whatsapp_number || "").replace(/[^0-9]/g, "");
  if (!enabled || !wa) return null;

  const href = `https://wa.me/${wa}?text=${encodeURIComponent("আসসালামু আলাইকুম, আমি একটা প্রোডাক্ট সম্পর্কে জানতে চাই।")}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="আমাদের সাথে কথা বলুন"
      title="আমাদের সাথে কথা বলুন"
      className="hidden lg:flex fixed bottom-6 right-6 z-40 h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-emerald-500/40 hover:scale-110 transition group"
    >
      <MessageCircle className="h-7 w-7 fill-white/20" />
      <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-card text-card-foreground border border-border px-3 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none">
        আমাদের সাথে কথা বলুন
      </span>
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
    </a>
  );
}
