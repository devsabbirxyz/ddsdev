import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Expose the VAPID public key to the browser (safe to be public).
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async () => {
  return { publicKey: process.env.VAPID_PUBLIC_KEY || "" };
});

// Save (or update) a push subscription for the authenticated user.
export const savePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      endpoint: z.string().url(),
      p256dh: z.string().min(1),
      auth: z.string().min(1),
      userAgent: z.string().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          user_id: userId,
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_agent: data.userAgent || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removePushSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ endpoint: z.string().url() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", data.endpoint);
    return { ok: true };
  });

// Admin: broadcast to all subscribers (Flash Sale / Announcement)
export const adminBroadcastPush = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      title: z.string().min(1).max(100),
      body: z.string().min(1).max(300),
      url: z.string().optional(),
      image: z.string().url().optional().or(z.literal("")),
      onlyActiveDays: z.number().int().positive().optional(),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as any;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { data: isSuper } = await supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" });
    if (!isAdmin && !isSuper) throw new Error("Forbidden");

    const { broadcastPush } = await import("@/lib/push.server");
    return await broadcastPush(
      {
        title: data.title,
        body: data.body,
        url: data.url || "/",
        image: data.image || undefined,
        tag: "broadcast",
      },
      { eventType: "broadcast", filter: data.onlyActiveDays ? { onlyActiveDays: data.onlyActiveDays } : undefined },
    );
  });

// Admin: recent push log
export const adminListPushLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { data: isSuper } = await supabase.rpc("has_role", { _user_id: userId, _role: "super_admin" });
    if (!isAdmin && !isSuper) throw new Error("Forbidden");

    const [{ data: log }, { count: totalSubs }] = await Promise.all([
      supabase.from("push_notification_log").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);
    return { log: log ?? [], totalSubs: totalSubs ?? 0 };
  });
