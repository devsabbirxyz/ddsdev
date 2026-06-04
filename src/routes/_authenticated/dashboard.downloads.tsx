import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Download, BookOpen, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type OrderRow = {
  id: string;
  order_number: string;
  product_title: string | null;
  product_id: string | null;
  delivery_content: string | null;
  updated_at: string | null;
};

type GuideRow = {
  id: string;
  use_guide_type: "text" | "image" | "video" | "none" | null;
  use_guide_text: string | null;
  use_guide_image_url: string | null;
  use_guide_video_url: string | null;
  use_guide_visible_after_purchase: boolean | null;
};

const downloadsQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["my-downloads", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,product_title,product_id,delivery_content,updated_at")
        .eq("user_id", userId!)
        .eq("status", "approved")
        .not("delivery_content", "is", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const orders = (data ?? []) as OrderRow[];
      const productIds = Array.from(new Set(orders.map((o) => o.product_id).filter(Boolean) as string[]));
      let guides: Record<string, GuideRow> = {};
      if (productIds.length) {
        const { data: gd } = await supabase
          .from("products")
          .select("id,use_guide_type,use_guide_text,use_guide_image_url,use_guide_video_url,use_guide_visible_after_purchase")
          .in("id", productIds);
        for (const g of (gd ?? []) as GuideRow[]) guides[g.id] = g;
      }
      return { orders, guides };
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/downloads")({
  component: DownloadsPage,
});

function ytEmbed(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    let id = "";
    if (u.hostname.includes("youtu.be")) id = u.pathname.slice(1);
    else if (u.searchParams.get("v")) id = u.searchParams.get("v") || "";
    else if (u.pathname.startsWith("/embed/")) id = u.pathname.split("/embed/")[1] || "";
    else if (u.pathname.startsWith("/shorts/")) id = u.pathname.split("/shorts/")[1] || "";
    id = id.split(/[/?&]/)[0];
    if (!/^[\w-]{6,}$/.test(id)) return null;
    return `https://www.youtube.com/embed/${id}`;
  } catch { return null; }
}

// Light-weight markdown-ish renderer (bold, italic, headings, lists, links, newlines)
function renderGuideText(src: string) {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = src.split(/\r?\n/);
  let html = "";
  let inList = false;
  for (const raw of lines) {
    const line = escape(raw);
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) { html += "<ul class='list-disc pl-6 space-y-1'>"; inList = true; }
      html += `<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`;
      continue;
    }
    if (inList) { html += "</ul>"; inList = false; }
    if (/^###\s+/.test(line)) html += `<h3 class='font-bold text-base mt-3'>${inline(line.replace(/^###\s+/, ""))}</h3>`;
    else if (/^##\s+/.test(line)) html += `<h2 class='font-bold text-lg mt-3'>${inline(line.replace(/^##\s+/, ""))}</h2>`;
    else if (/^#\s+/.test(line)) html += `<h1 class='font-bold text-xl mt-3'>${inline(line.replace(/^#\s+/, ""))}</h1>`;
    else if (line.trim() === "") html += "<div class='h-2'></div>";
    else html += `<p>${inline(line)}</p>`;
  }
  if (inList) html += "</ul>";
  return html;
  function inline(s: string) {
    return s
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label: string, url: string) => {
        const safeUrl = url.replace(/"/g, "%22").replace(/'/g, "%27");
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-primary underline">${label}</a>`;
      })
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
  }
}

function DownloadsPage() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery(downloadsQuery(user?.id));
  const orders = data?.orders ?? [];
  const guides = data?.guides ?? {};
  const [activeGuide, setActiveGuide] = useState<{ title: string; guide: GuideRow } | null>(null);
  const [fullImage, setFullImage] = useState<string | null>(null);

  const embed = useMemo(
    () => (activeGuide?.guide.use_guide_video_url ? ytEmbed(activeGuide.guide.use_guide_video_url) : null),
    [activeGuide],
  );

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6">আপনার ডাউনলোড / অ্যাক্সেস</h1>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">লোড হচ্ছে...</div>
      ) : orders.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Download className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">এখনো কোনো ডেলিভার করা প্রোডাক্ট নেই</p>
          <Link to="/dashboard/orders" className="mt-4 inline-block text-xs text-primary hover:underline">অর্ডার স্ট্যাটাস দেখুন</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const g = o.product_id ? guides[o.product_id] : undefined;
            const hasGuide =
              g &&
              g.use_guide_type &&
              g.use_guide_type !== "none" &&
              (g.use_guide_visible_after_purchase ?? true) &&
              ((g.use_guide_type === "text" && g.use_guide_text) ||
                (g.use_guide_type === "image" && g.use_guide_image_url) ||
                (g.use_guide_type === "video" && g.use_guide_video_url));
            return (
              <div key={o.id} className="glass-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-display font-bold">{o.product_title}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{o.order_number}</div>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap break-words text-sm font-mono bg-background/40 rounded-xl p-4 max-h-64 overflow-auto">{o.delivery_content}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => navigator.clipboard?.writeText(o.delivery_content ?? "")} className="rounded-lg glass px-3 py-1.5 text-xs font-semibold hover:bg-accent">কপি করুন</button>
                  {hasGuide && (
                    <button
                      onClick={() => setActiveGuide({ title: o.product_title || "Use Guide", guide: g! })}
                      className="rounded-lg bg-gradient-brand text-primary-foreground px-3 py-1.5 text-xs font-bold inline-flex items-center gap-1.5 shadow-glow"
                    >
                      <BookOpen className="h-3.5 w-3.5" /> 📖 Use Guide
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeGuide && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveGuide(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-white/10 bg-background/95 backdrop-blur-xl shadow-2xl"
            style={{ borderRadius: 16 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 bg-background/95 backdrop-blur-xl">
              <h2 className="font-display font-bold text-lg inline-flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> 📖 কীভাবে ব্যবহার করবেন
              </h2>
              <button
                onClick={() => setActiveGuide(null)}
                className="rounded-full p-1.5 hover:bg-accent"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-5 py-4 text-xs text-muted-foreground">{activeGuide.title}</div>
            <div className="px-5 pb-6">
              {activeGuide.guide.use_guide_type === "text" && activeGuide.guide.use_guide_text && (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none space-y-2 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderGuideText(activeGuide.guide.use_guide_text) }}
                />
              )}
              {activeGuide.guide.use_guide_type === "image" && activeGuide.guide.use_guide_image_url && (
                <button
                  onClick={() => setFullImage(activeGuide.guide.use_guide_image_url!)}
                  className="block w-full rounded-xl overflow-hidden border border-border hover:border-primary/60 transition"
                >
                  <img src={activeGuide.guide.use_guide_image_url} alt="Use Guide" className="w-full h-auto" />
                </button>
              )}
              {activeGuide.guide.use_guide_type === "video" && (
                embed ? (
                  <div className="rounded-xl overflow-hidden border border-border aspect-video bg-black">
                    <iframe src={embed} title="Use Guide" allowFullScreen className="w-full h-full" />
                  </div>
                ) : (
                  <p className="text-sm text-destructive">ভিডিও লোড করা যাচ্ছে না।</p>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {fullImage && (
        <div
          className="fixed inset-0 z-[90] grid place-items-center p-4 bg-black/95"
          onClick={() => setFullImage(null)}
        >
          <button
            onClick={() => setFullImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={fullImage} alt="Full preview" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}
