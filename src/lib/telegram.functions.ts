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

// Escape user-supplied strings so they cannot inject Telegram HTML/markup.
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fmtTime() {
  return new Date().toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" });
}

async function loadTelegramCreds() {
  const { data: rows } = await supabaseAdmin
    .from("site_settings")
    .select("key,value")
    .in("key", ["telegram_bot_token", "telegram_chat_id"]);
  const map: Record<string, string> = {};
  for (const r of rows ?? []) map[r.key] = r.value ?? "";
  return { token: map.telegram_bot_token, chat: map.telegram_chat_id };
}

// Template payload schema — client picks a template and provides validated
// fields; the server constructs the actual message. Free-form text is not
// accepted, so signed-in users cannot send arbitrary content to the admin.
const templateSchema = z.discriminatedUnion("template", [
  z.object({
    template: z.literal("new_order"),
    name: z.string().min(1).max(200),
    phone: z.string().min(1).max(50),
    product: z.string().min(1).max(300),
    amount: z.number().finite().nonnegative().max(1_000_000_000),
  }),
  z.object({
    template: z.literal("new_signup"),
    email: z.string().email().max(255),
    name: z.string().min(1).max(200),
  }),
  z.object({
    template: z.literal("new_ticket"),
    name: z.string().min(1).max(200),
    subject: z.string().min(1).max(300),
    message: z.string().min(1).max(2000),
  }),
  z.object({
    template: z.literal("password_reset"),
    email: z.string().email().max(255),
  }),
  z.object({
    template: z.literal("payment_submit"),
    name: z.string().min(1).max(200),
    amount: z.number().finite().nonnegative().max(1_000_000_000),
    method: z.string().min(1).max(100),
    trxId: z.string().min(1).max(200),
  }),
]);

type TemplatePayload = z.infer<typeof templateSchema>;

function buildMessage(p: TemplatePayload, adminLink: string): string {
  const time = fmtTime();
  const link = adminLink ? `\n\n🔗 Admin Panel দেখুন: ${esc(adminLink)}` : "";
  switch (p.template) {
    case "new_order":
      return `🛒 <b>নতুন অর্ডার!</b>\n👤 নাম: ${esc(p.name)}\n📱 ফোন: ${esc(p.phone)}\n🛍️ পণ্য: ${esc(p.product)}\n💰 টাকা: ${p.amount} টাকা\n🕐 সময়: ${time}${link}`;
    case "new_signup":
      return `👤 <b>নতুন কাস্টমার রেজিস্ট্রেশন!</b>\n📧 ইমেইল: ${esc(p.email)}\n👤 নাম: ${esc(p.name)}\n🕐 সময়: ${time}${link}`;
    case "new_ticket":
      return `🎫 <b>নতুন সাপোর্ট টিকিট!</b>\n👤 নাম: ${esc(p.name)}\n📝 বিষয়: ${esc(p.subject)}\n💬 বার্তা: ${esc(p.message)}\n🕐 সময়: ${time}${link}`;
    case "password_reset":
      return `🔑 <b>পাসওয়ার্ড রিসেট রিকোয়েস্ট!</b>\n📧 ইমেইল: ${esc(p.email)}\n🕐 সময়: ${time}${link}`;
    case "payment_submit":
      return `💳 <b>নতুন পেমেন্ট সাবমিট!</b>\n👤 নাম: ${esc(p.name)}\n💰 পরিমাণ: ${p.amount} টাকা\n🏦 মেথড: ${esc(p.method)}\n🔢 TrxID: ${esc(p.trxId)}\n🕐 সময়: ${time}${link}`;
  }
}

// Authenticated — accepts only predefined templates. The message text itself
// is constructed server-side from validated fields, so callers cannot inject
// arbitrary HTML or free-form content into the admin's Telegram chat.
export const sendTelegramNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      payload: templateSchema,
      origin: z.string().url().max(500).optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { claims, userId } = context as { claims?: { email?: string }; userId: string };
    const p = data.payload;

    // Ownership / rate checks per template — the caller can only trigger
    // notifications that plausibly belong to them.
    if (p.template === "new_signup" || p.template === "password_reset") {
      if (!claims?.email || claims.email.toLowerCase() !== p.email.toLowerCase()) {
        return { ok: false, skipped: true };
      }
    }
    if (p.template === "new_order" || p.template === "payment_submit") {
      // Must have at least one recent order owned by this user in the last 10 minutes.
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recent } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", since)
        .limit(1);
      if (!recent || recent.length === 0) return { ok: false, skipped: true };
    }
    if (p.template === "new_ticket") {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: recent } = await supabaseAdmin
        .from("support_tickets")
        .select("id")
        .eq("user_id", userId)
        .gte("created_at", since)
        .limit(1);
      if (!recent || recent.length === 0) return { ok: false, skipped: true };
    }

    const { token, chat } = await loadTelegramCreds();
    if (!token || !chat) return { ok: false, skipped: true };
    const msg = buildMessage(p, data.origin ?? "");
    try {
      await tgSend(token, chat, msg);
      return { ok: true };
    } catch (e: any) {
      console.error("Telegram send failed:", e?.message);
      return { ok: false, error: "send_failed" };
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
    const { token, chat } = await loadTelegramCreds();
    if (!token || !chat) return { ok: false, skipped: true };
    const msg = buildMessage(
      { template: "new_signup", email: data.email, name: data.name },
      data.origin ?? "",
    );
    try {
      await tgSend(token, chat, msg);
      return { ok: true };
    } catch (e: any) {
      console.error("Telegram signup notify failed:", e?.message);
      return { ok: false, error: "send_failed" };
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
