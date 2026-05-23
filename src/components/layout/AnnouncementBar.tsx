import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { siteSettingsQuery } from "@/lib/site-settings";

export function AnnouncementBar() {
  const { data: s } = useQuery(siteSettingsQuery);
  const [closed, setClosed] = useState(false);

  const enabled = (s?.announcement_enabled ?? "1") === "1";
  const text = s?.announcement_text ?? "";
  const link = s?.announcement_link ?? "";
  const bg = s?.announcement_bg || "#7c3aed";
  const color = s?.announcement_color || "#ffffff";
  const scroll = (s?.announcement_scroll ?? "1") === "1";

  // Per-text dismissal: if text changes, show again
  const dismissKey = `ann_dismissed:${text}`;
  useEffect(() => {
    if (typeof window !== "undefined" && text) {
      setClosed(window.localStorage.getItem(dismissKey) === "1");
    }
  }, [dismissKey, text]);

  if (!enabled || !text || closed) return null;

  const dismiss = () => {
    setClosed(true);
    try { window.localStorage.setItem(dismissKey, "1"); } catch {}
  };

  const inner = scroll ? (
    <div className="overflow-hidden flex-1">
      <div className="whitespace-nowrap inline-block animate-marquee">
        <span className="mx-8">{text}</span>
        <span className="mx-8">{text}</span>
        <span className="mx-8">{text}</span>
      </div>
    </div>
  ) : (
    <div className="flex-1 text-center truncate px-2">{text}</div>
  );

  return (
    <div className="relative w-full text-xs sm:text-sm font-medium" style={{ background: bg, color }}>
      <div className="mx-auto max-w-7xl flex items-center gap-2 px-4 sm:px-6 py-1.5">
        {link ? (
          <a href={link} className="flex-1 hover:underline" target={link.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
            {inner}
          </a>
        ) : (
          inner
        )}
        <button
          onClick={dismiss}
          aria-label="Close announcement"
          className="shrink-0 grid place-items-center h-6 w-6 rounded-full hover:bg-black/20 transition"
          style={{ color }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.333%); } }
        .animate-marquee { animation: marquee 25s linear infinite; }
      `}</style>
    </div>
  );
}
