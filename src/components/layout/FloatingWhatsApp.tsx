import { useQuery } from "@tanstack/react-query";

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
    <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.13-.63.044-1.003-.115-.3-2.064-1.69-2.464-1.69zm-2.64 5.704h-.014a8.527 8.527 0 0 1-4.34-1.184l-.314-.187-3.222.845.86-3.137-.2-.33a8.566 8.566 0 0 1-1.302-4.554c.014-4.726 3.854-8.567 8.581-8.567a8.51 8.51 0 0 1 6.066 2.508 8.55 8.55 0 0 1 2.494 6.066c0 4.726-3.84 8.539-8.61 8.539zm7.297-15.864A10.247 10.247 0 0 0 16.47 4c-5.685 0-10.31 4.625-10.323 10.31 0 1.816.473 3.59 1.376 5.154L6 25l5.71-1.49a10.314 10.314 0 0 0 4.926 1.246h.014c5.685 0 10.31-4.626 10.32-10.31a10.25 10.25 0 0 0-3.21-7.4z"/>
  </svg>
);
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
      <WhatsAppIcon className="h-7 w-7" />
      <span className="absolute right-full mr-3 whitespace-nowrap rounded-lg bg-card text-card-foreground border border-border px-3 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-none">
        আমাদের সাথে কথা বলুন
      </span>
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
    </a>
  );
}
