import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Cron endpoint: runs daily. Two responsibilities:
// 1) Mark expired active subscriptions as 'expired' (or auto-renew them).
// 2) For auto-renew subs that expire within 3 days, create a pending renewal order
//    (since this site uses manual payment, the order is created in pending state
//    so the user can complete payment, similar to a normal checkout).
// 3) Send a notification 3 days before expiry as a reminder.

export const Route = createFileRoute("/api/public/hooks/process-subscriptions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Require Supabase anon/publishable apikey to invoke (matches pg_cron pattern).
        const apiKey = request.headers.get("apikey") || request.headers.get("x-api-key");
        const expected =
          process.env.SUPABASE_ANON_KEY ||
          process.env.SUPABASE_PUBLISHABLE_KEY ||
          process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!apiKey || !expected || apiKey !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const now = new Date();
        const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const result = { expired: 0, renewals_created: 0, reminders_sent: 0 };

        // 1) Mark expired
        const { data: expired } = await supabaseAdmin
          .from("subscriptions" as any)
          .update({ status: "expired" } as any)
          .eq("status", "active")
          .lt("expires_at", now.toISOString())
          .select("id");
        result.expired = expired?.length ?? 0;

        // 2) Find subs expiring within 3 days that are still active and auto-renew enabled
        const { data: expiring } = await supabaseAdmin
          .from("subscriptions" as any)
          .select(
            "id,user_id,product_id,plan_id,auto_renew,expires_at,payment_method,customer_name,customer_email,customer_phone,customer_input,renewal_reminder_sent_at",
          )
          .eq("status", "active")
          .lte("expires_at", in3Days.toISOString())
          .gte("expires_at", now.toISOString());

        for (const sub of (expiring ?? []) as any[]) {
          // Reminder notification (once per cycle)
          if (!sub.renewal_reminder_sent_at) {
            await supabaseAdmin.from("notifications" as any).insert({
              user_id: sub.user_id,
              type: "subscription",
              title: "সাবস্ক্রিপশন শীঘ্রই শেষ হবে",
              message: `আপনার সাবস্ক্রিপশন ${new Date(sub.expires_at).toLocaleDateString("bn-BD")} তারিখে শেষ হবে।`,
              link: "/dashboard/subscriptions",
            } as any);
            await supabaseAdmin
              .from("subscriptions" as any)
              .update({ renewal_reminder_sent_at: now.toISOString() } as any)
              .eq("id", sub.id);
            result.reminders_sent++;
          }

          if (!sub.auto_renew) continue;

          // Load plan + product for pricing
          const { data: plan } = await supabaseAdmin
            .from("subscription_plans" as any)
            .select("id,name,price,duration_days,is_active")
            .eq("id", sub.plan_id)
            .maybeSingle();
          if (!plan || !(plan as any).is_active) continue;

          const { data: product } = await supabaseAdmin
            .from("products")
            .select("id,title,seller_id,is_active,status")
            .eq("id", sub.product_id)
            .maybeSingle();
          if (!product || !product.is_active || product.status !== "approved") continue;

          // Avoid duplicate renewal: skip if a pending renewal order already exists for this sub
          const { data: existing } = await supabaseAdmin
            .from("orders")
            .select("id")
            .eq("subscription_id", sub.id)
            .eq("is_renewal", true)
            .eq("status", "pending")
            .limit(1);
          if (existing && existing.length > 0) continue;

          const orderNumber = `SUB-${Date.now().toString(36).toUpperCase()}-${sub.id.slice(0, 4)}`;
          const price = Number((plan as any).price);

          const { data: inserted } = await supabaseAdmin
            .from("orders")
            .insert({
              order_number: orderNumber,
              user_id: sub.user_id,
              product_id: sub.product_id,
              product_title: `${product.title} (${(plan as any).name})`,
              quantity: 1,
              regular_price: price,
              offer_price: price,
              total_price: price,
              customer_name: sub.customer_name ?? "",
              customer_email: sub.customer_email ?? "",
              customer_phone: sub.customer_phone ?? "",
              customer_input: sub.customer_input,
              payment_method: sub.payment_method ?? "manual",
              payment_type: "manual",
              seller_id: product.seller_id,
              status: "pending",
              delivery_status: "pending",
              subscription_id: sub.id,
              is_renewal: true,
            } as any)
            .select("id")
            .single();

          await supabaseAdmin
            .from("subscriptions" as any)
            .update({ status: "pending_renewal", last_order_id: inserted?.id ?? null } as any)
            .eq("id", sub.id);

          await supabaseAdmin.from("notifications" as any).insert({
            user_id: sub.user_id,
            type: "subscription",
            title: "রিনিউয়াল অর্ডার তৈরি হয়েছে",
            message: `${product.title} সাবস্ক্রিপশন রিনিউ করতে পেমেন্ট সম্পন্ন করুন।`,
            link: "/dashboard/orders",
          } as any);

          result.renewals_created++;
        }

        return new Response(JSON.stringify({ ok: true, ...result }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
