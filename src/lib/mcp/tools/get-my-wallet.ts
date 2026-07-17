import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_my_wallet",
  title: "Get my wallet",
  description: "Return the signed-in user's wallet points balance and recent wallet transactions.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max recent transactions to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const sb = supabaseForUser(ctx);
    const [{ data: u }, { data: tx }] = await Promise.all([
      sb.from("users").select("wallet_points").eq("id", ctx.getUserId()).maybeSingle(),
      sb.from("wallet_transactions")
        .select("id,points,type,order_id,description,created_at")
        .order("created_at", { ascending: false })
        .limit(Math.min(limit ?? 20, 50)),
    ]);
    const balance = Number((u as any)?.wallet_points ?? 0);
    const transactions = (tx as any[]) ?? [];
    return {
      content: [{ type: "text", text: JSON.stringify({ balance, transactions }) }],
      structuredContent: { balance, transactions },
    };
  },
});
