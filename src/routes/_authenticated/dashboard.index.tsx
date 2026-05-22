import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { ShoppingBag, Download, Heart, Bell, Ticket, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/lib/wishlist";
import { formatBDT } from "@/lib/storefront";

const statsQuery = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["dashboard-stats", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return { orders: 0, pending: 0, approved: 0, spent: 0, notifs: 0, tickets: 0, recent: [] as any[] };
      const [orders, notifs, tickets] = await Promise.all([
        supabase.from("orders").select("id,order_number,product_title,total_price,status,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
        supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("is_read", false),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      const all = orders.data ?? [];
      return {
        orders: all.length,
        pending: all.filter((o) => o.status === "pending").length,
        approved: all.filter((o) => o.status === "approved").length,
        spent: all.filter((o) => o.status === "approved").reduce((s, o) => s + Number(o.total_price ?? 0), 0),
        notifs: notifs.count ?? 0,
        tickets: tickets.count ?? 0,
        recent: all,
      };
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useAuth();
  const { items: wish } = useWishlist();
  const { data } = useQuery(statsQuery(user?.id));

  const tiles = [
    { icon: ShoppingBag, label: "অর্ডার", value: data?.orders ?? 0, to: "/dashboard/orders" },
    { icon: Download, label: "ডাউনলোড", value: data?.approved ?? 0, to: "/dashboard/downloads" },
    { icon: Heart, label: "উইশলিস্ট", value: wish.length, to: "/dashboard/wishlist" },
    { icon: Bell, label: "নোটিফিকেশন", value: data?.notifs ?? 0, to: "/dashboard/notifications" },
    { icon: Ticket, label: "টিকেট", value: data?.tickets ?? 0, to: "/dashboard/support" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-3xl">স্বাগতম 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">আপনার ড্যাশবোর্ডে স্বাগতম</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 bg-gradient-brand text-primary-foreground sm:col-span-2 lg:col-span-3">
          <div className="text-xs opacity-80">মোট খরচ</div>
          <div className="font-display font-bold text-4xl mt-1">{formatBDT(data?.spent ?? 0)}</div>
          <div className="text-xs opacity-80 mt-1">{data?.approved ?? 0}টি অর্ডার সম্পন্ন · {data?.pending ?? 0}টি pending</div>
        </div>
        {tiles.map((t) => (
          <Link key={t.label} to={t.to} className="glass-card rounded-2xl p-5 hover:shadow-glow transition group">
            <div className="flex items-center justify-between mb-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand text-primary-foreground"><t.icon className="h-5 w-5" /></div>
              <span className="text-2xl font-display font-bold">{t.value}</span>
            </div>
            <div className="text-sm font-medium flex items-center justify-between">{t.label} <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" /></div>
          </Link>
        ))}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">সাম্প্রতিক অর্ডার</h2>
          <Link to="/dashboard/orders" className="text-xs text-primary hover:underline">সব দেখুন</Link>
        </div>
        {!data?.recent.length ? (
          <div className="text-center py-8 text-sm text-muted-foreground">এখনো কোনো অর্ডার নেই — <Link to="/shop" className="text-primary hover:underline">শপিং শুরু করুন</Link></div>
        ) : (
          <div className="space-y-2">
            {data.recent.map((o) => (
              <Link key={o.id} to="/order/$id" params={{ id: o.id }} className="flex items-center justify-between gap-3 rounded-xl glass p-3 hover:bg-accent transition">
                <div className="min-w-0">
                  <div className="font-semibold text-sm truncate">{o.product_title}</div>
                  <div className="text-xs text-muted-foreground font-mono">{o.order_number}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-sm">{formatBDT(o.total_price)}</div>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "approved" ? "bg-primary/15 text-primary" : status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground";
  const lbl = status === "approved" ? "সফল" : status === "rejected" ? "বাতিল" : "Pending";
  return <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{lbl}</span>;
}
