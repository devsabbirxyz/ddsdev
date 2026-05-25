import { createServerFn } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { userId } = context;
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "super_admin"])
      .limit(1);
    if (!data || data.length === 0) throw new Error("Forbidden");
    return next({ context: { adminId: userId } });
  });

async function tgSend(token: string, chatId: string, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || !j?.ok) throw new Error(j?.description || `HTTP ${res.status}`);
  return j;
}

// Public — called from anywhere (signup, checkout, ticket, etc.)
export const sendTelegramNotification = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    z.object({ message: z.string().min(1).max(3500) }).parse(i),
  )
  .handler(async ({ data }) => {
    const { data: rows } = await supabaseAdmin
      .from("site_settings")
      .select("key,value")
      .in("key", ["telegram_bot_token", "telegram_chat_id"]);
    const map: Record<string, string> = {};
    for (const r of rows ?? []) map[r.key] = r.value ?? "";
    const token = map.telegram_bot_token;
    const chat = map.telegram_chat_id;
    if (!token || !chat) return { ok: false, skipped: true };
    try {
      await tgSend(token, chat, data.message);
      return { ok: true };
    } catch (e: any) {
      console.error("Telegram send failed:", e?.message);
      return { ok: false, error: e?.message };
    }
  });

// Admin-only — test with provided credentials
export const testTelegramNotification = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((i: unknown) =>
    z.object({
      bot_token: z.string().min(10).max(200),
      chat_id: z.string().min(1).max(50),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    await tgSend(
      data.bot_token,
      data.chat_id,
      "✅ টেস্ট নোটিফিকেশন! আপনার সাইটের Telegram notification সফলভাবে কাজ করছে।",
    );
    return { ok: true };
  });
