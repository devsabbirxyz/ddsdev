import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Cron endpoint: runs hourly. Finds abandoned carts older than 1 hour that
// haven't been reminded yet, and sends a browser push notification to bring
// the shopper back.

export const Route = createFileRoute("/api/public/hooks/process-abandoned-carts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = request.headers.get("x-cron-secret") || request.headers.get("x-api-key");
        const expected = process.env.CRON_SECRET;
        if (!expected) return new Response("Server misconfigured", { status: 500 });
        if (!apiKey || apiKey !== expected) return new Response("Unauthorized", { status: 401 });

        // Carts abandoned 1+ hour ago, not yet reminded, and worth notifying (>= 100 BDT)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: carts } = await supabaseAdmin
          .from("abandoned_carts" as any)
          .select("id, user_id, item_count, subtotal")
          .lt("updated_at", oneHourAgo)
          .is("push_reminded_at", null)
          .gte("subtotal", 100)
          .limit(200);

        if (!carts || carts.length === 0) {
          return new Response(JSON.stringify({ ok: true, reminded: 0 }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const { sendPushToUser } = await import("@/lib/push.server");
        let reminded = 0;
        for (const c of carts as any[]) {
          try {
            const res = await sendPushToUser(
              c.user_id,
              {
                title: "🛒 আপনার কার্টে আইটেম অপেক্ষা করছে!",
                body: `${c.item_count}টি প্রোডাক্ট (৳${Number(c.subtotal).toLocaleString("bn-BD")}) — এখনই অর্ডার সম্পন্ন করুন`,
                url: "/cart",
                tag: "abandoned-cart",
                requireInteraction: false,
              },
              { eventType: "abandoned_cart", referenceId: c.id },
            );
            if (res.sent > 0) reminded++;
            await supabaseAdmin
              .from("abandoned_carts" as any)
              .update({ push_reminded_at: new Date().toISOString() } as any)
              .eq("id", c.id);
          } catch (e) {
            console.error("[abandoned-cart-cron]", e);
          }
        }

        return new Response(JSON.stringify({ ok: true, checked: carts.length, reminded }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
