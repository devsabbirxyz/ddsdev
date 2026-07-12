import { createServerFn } from "@tanstack/react-start";

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

  const out: Array<{
    name: string;
    city: string | null;
    productTitle: string;
    createdAt: string;
  }> = [];

  for (const o of data ?? []) {
    const items = Array.isArray((o as any).items) ? ((o as any).items as any[]) : [];
    const first = items[0];
    const productTitle: string | undefined =
      first?.title || first?.name || first?.product_title;
    if (!productTitle) continue;

    const full = String((o as any).customer_name || "").trim();
    if (!full) continue;
    const firstName = full.split(/\s+/)[0];
    // Mask: keep first name only
    out.push({
      name: firstName,
      city: (o as any).customer_city || null,
      productTitle: String(productTitle).slice(0, 60),
      createdAt: (o as any).created_at,
    });
  }

  return { purchases: out };
});
