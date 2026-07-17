import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_products",
  title: "List products",
  description: "Browse the storefront catalog. Returns active, approved products with title, slug, price, and rating. Supports keyword search and category filter.",
  inputSchema: {
    query: z.string().trim().max(200).optional().describe("Optional keyword to match in product title."),
    category_slug: z.string().trim().max(120).optional().describe("Optional category slug filter."),
    limit: z.number().int().min(1).max(50).optional().describe("Max products to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category_slug, limit }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let q = sb
      .from("products")
      .select("id,slug,title,short_description,regular_price,offer_price,average_rating,total_reviews")
      .eq("is_active", true)
      .eq("status", "approved")
      .limit(Math.min(limit ?? 20, 50));
    if (query) q = q.ilike("title", `%${query}%`);
    if (category_slug) {
      const { data: cat } = await sb.from("categories").select("id").eq("slug", category_slug).maybeSingle();
      if (cat) q = q.eq("category_id", (cat as any).id);
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
