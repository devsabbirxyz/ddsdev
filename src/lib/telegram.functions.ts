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

// Authenticated — called from order/ticket/payment flows after user is signed in
export const sendTelegramNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
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

// Authenticated — fire notification on new signup (caller must be the signed-up user)
export const notifyNewSignupServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      email: z.string().email().max(255),
      name: z.string().min(1).max(200),
      origin: z.string().url().max(500).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { claims } = context as { claims?: { email?: string } };
    if (!claims?.email || claims.email.toLowerCase() !== data.email.toLowerCase()) {
      return { ok: false, skipped: true };
    }
    const { data: rows } = await supabaseAdmin
      .from("site_settings")
      .select("key,value")
      .in("key", ["telegram_bot_token", "telegram_chat_id"]);
    const map: Record<string, string> = {};
    for (const r of rows ?? []) map[r.key] = r.value ?? "";
    const token = map.telegram_bot_token;
    const chat = map.telegram_chat_id;
    if (!token || !chat) return { ok: false, skipped: true };
    const time = new Date().toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });
    const adminLink = data.origin ? `\n\n🔗 Admin Panel দেখুন: ${data.origin}/admin` : "";
    const msg = `👤 <b>নতুন কাস্টমার রেজিস্ট্রেশন!</b>\n📧 ইমেইল: ${data.email}\n👤 নাম: ${data.name}\n🕐 সময়: ${time}${adminLink}`;
    try {
      await tgSend(token, chat, msg);
      return { ok: true };
    } catch (e: any) {
      console.error("Telegram signup notify failed:", e?.message);
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
