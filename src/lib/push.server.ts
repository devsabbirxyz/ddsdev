// Server-only web-push helper. Never import from client code.
import webpush from "web-push";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:support@ddsdev.lovable.app";
  if (!publicKey || !privateKey) throw new Error("VAPID keys not configured");
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
};

async function sendToSubscription(
  sub: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: PushPayload,
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 },
    );
    return true;
  } catch (err: any) {
    // 404/410 = gone → disable subscription
    if (err?.statusCode === 404 || err?.statusCode === 410) {
      await supabaseAdmin
        .from("push_subscriptions")
        .update({ is_active: false })
        .eq("id", sub.id);
    }
    console.error("[push] send failed", sub.endpoint, err?.statusCode, err?.body);
    return false;
  }
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  opts: { eventType: string; referenceId?: string | null } = { eventType: "generic" },
) {
  ensureVapid();
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (!subs || subs.length === 0) return { sent: 0, failed: 0 };

  const results = await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
  const sent = results.filter(Boolean).length;
  const failed = results.length - sent;

  await supabaseAdmin.from("push_notification_log").insert({
    user_id: userId,
    event_type: opts.eventType,
    title: payload.title,
    body: payload.body,
    link: payload.url || null,
    reference_id: opts.referenceId || null,
    sent_count: sent,
    failed_count: failed,
  });

  if (sent > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .update({ last_notified_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("is_active", true);
  }

  return { sent, failed };
}

export async function broadcastPush(
  payload: PushPayload,
  opts: { eventType: string; filter?: { onlyActiveDays?: number } } = { eventType: "broadcast" },
) {
  ensureVapid();
  let q = supabaseAdmin
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("is_active", true);

  if (opts.filter?.onlyActiveDays) {
    const since = new Date(Date.now() - opts.filter.onlyActiveDays * 86400 * 1000).toISOString();
    q = q.gte("updated_at", since);
  }

  const { data: subs } = await q;
  if (!subs || subs.length === 0) return { sent: 0, failed: 0, totalSubs: 0 };

  // Batch in groups of 100 to avoid overwhelming
  const BATCH = 100;
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < subs.length; i += BATCH) {
    const chunk = subs.slice(i, i + BATCH);
    const results = await Promise.all(chunk.map((s) => sendToSubscription(s, payload)));
    sent += results.filter(Boolean).length;
    failed += results.length - results.filter(Boolean).length;
  }

  await supabaseAdmin.from("push_notification_log").insert({
    user_id: null,
    event_type: opts.eventType,
    title: payload.title,
    body: payload.body,
    link: payload.url || null,
    sent_count: sent,
    failed_count: failed,
  });

  return { sent, failed, totalSubs: subs.length };
}
