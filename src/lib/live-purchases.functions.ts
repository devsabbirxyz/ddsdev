import { createServerFn } from "@tanstack/react-start";

type Purchase = {
  name: string;
  city: string | null;
  productTitle: string;
  createdAt: string;
};

// Fallback demo purchases so the social-proof toast keeps rotating
// even when there are no recent real orders yet.
const DEMO_PURCHASES: Array<{ name: string; city: string; productTitle: string; minutesAgo: number }> = [
  { name: "রহিম", city: "ঢাকা", productTitle: "ChatGPT Plus (1 Month)", minutesAgo: 3 },
  { name: "সাব্বির", city: "চট্টগ্রাম", productTitle: "Canva Pro (1 Year)", minutesAgo: 7 },
  { name: "নাফিস", city: "সিলেট", productTitle: "Gemini Pro (1 Month)", minutesAgo: 12 },
  { name: "তানভীর", city: "রাজশাহী", productTitle: "Cursor Pro (1 Month)", minutesAgo: 18 },
  { name: "মেহেদী", city: "খুলনা", productTitle: "Notion AI (1 Year)", minutesAgo: 24 },
  { name: "ফাহিম", city: "বরিশাল", productTitle: "ElevenLabs Starter", minutesAgo: 33 },
  { name: "আরিফ", city: "ঢাকা", productTitle: "Replit Core (1 Month)", minutesAgo: 41 },
  { name: "সাকিব", city: "কুমিল্লা", productTitle: "Framer Pro (1 Month)", minutesAgo: 55 },
  { name: "রাকিব", city: "ময়মনসিংহ", productTitle: "ChatGPT Plus (1 Year)", minutesAgo: 72 },
  { name: "ইমরান", city: "নারায়ণগঞ্জ", productTitle: "Canva Pro (1 Month)", minutesAgo: 95 },
];

function buildDemoPurchases(): Purchase[] {
  const now = Date.now();
  return DEMO_PURCHASES.map((d) => ({
    name: d.name,
    city: d.city,
    productTitle: d.productTitle,
    createdAt: new Date(now - d.minutesAgo * 60_000).toISOString(),
  }));
}

// Public — returns anonymized recent purchase entries for social-proof popups.
// No PII: only first name + product title + rough time + optional city.
export const getRecentPurchases = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("orders")
    .select("customer_name, customer_city, items, created_at")
    .in("status", ["completed", "processing", "pending"])
    .order("created_at", { ascending: false })
    .limit(30);

  const out: Purchase[] = [];

  for (const o of data ?? []) {
    const items = Array.isArray((o as any).items) ? ((o as any).items as any[]) : [];
    const first = items[0];
    const productTitle: string | undefined =
      first?.title || first?.name || first?.product_title;
    if (!productTitle) continue;

    const full = String((o as any).customer_name || "").trim();
    if (!full) continue;
    const firstName = full.split(/\s+/)[0];
    out.push({
      name: firstName,
      city: (o as any).customer_city || null,
      productTitle: String(productTitle).slice(0, 60),
      createdAt: (o as any).created_at,
    });
  }

  // Top up with demo entries so the toast always has something to rotate.
  if (out.length < 10) {
    const need = 10 - out.length;
    out.push(...buildDemoPurchases().slice(0, need));
  }

  return { purchases: out };
});
