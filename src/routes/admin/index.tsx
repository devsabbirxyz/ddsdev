import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts";
import { TrendingUp, ShoppingCart, Users, Package, DollarSign, Clock, AlertCircle, Award } from "lucide-react";
import { useState } from "react";

type Range = "7d" | "30d" | "90d" | "all";

const overviewQuery = (range: Range) =>
  queryOptions({
    queryKey: ["admin", "overview", range],
    staleTime: 60_000,
    queryFn: async () => {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 3650;
      const since = new Date(Date.now() - days * 86400_000).toISOString();

      const [allOrders, rangeOrders, sellers, affiliates, products, pendingOrders, pendingSellers, pendingAffiliates, pendingProducts, pendingWithdrawalsS, pendingWithdrawalsA] = await Promise.all([
        supabase.from("orders").select("total_price", { count: "exact" }),
        supabase.from("orders").select("total_price, created_at, status").gte("created_at", since).order("created_at", { ascending: true }),
        supabase.from("sellers").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("affiliates").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("seller_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("affiliate_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("seller_withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("affiliate_withdrawals").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const revenue = (allOrders.data ?? []).reduce((sum, o: any) => sum + Number(o.total_price ?? 0), 0);

      // Build daily series
      const byDay = new Map<string, { date: string; revenue: number; orders: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000);
        const key = d.toISOString().slice(0, 10);
        byDay.set(key, { date: key.slice(5), revenue: 0, orders: 0 });
      }
      for (const o of (rangeOrders.data ?? []) as any[]) {
        const key = String(o.created_at).slice(0, 10);
        const bucket = byDay.get(key);
        if (bucket) {
          bucket.revenue += Number(o.total_price ?? 0);
          bucket.orders += 1;
        }
      }
      const series = Array.from(byDay.values());

      // Status breakdown for bar chart
      const statusMap: Record<string, number> = {};
      for (const o of (rangeOrders.data ?? []) as any[]) {
        statusMap[o.status ?? "pending"] = (statusMap[o.status ?? "pending"] ?? 0) + 1;
      }
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      return {
        revenue,
        rangeRevenue: series.reduce((s, d) => s + d.revenue, 0),
        rangeOrders: series.reduce((s, d) => s + d.orders, 0),
        orderCount: allOrders.count ?? 0,
        sellerCount: sellers.count ?? 0,
        affiliateCount: affiliates.count ?? 0,
        productCount: products.count ?? 0,
        series,
        statusData,
        pending: {
          orders: pendingOrders.count ?? 0,
          sellers: pendingSellers.count ?? 0,
          affiliates: pendingAffiliates.count ?? 0,
          products: pendingProducts.count ?? 0,
          withdrawals: (pendingWithdrawalsS.count ?? 0) + (pendingWithdrawalsA.count ?? 0),
        },
      };
    },
  });

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const [range, setRange] = useState<Range>("30d");
  const { data, isLoading } = useQuery(overviewQuery(range));

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 rounded-lg bg-muted" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0,1,2,3].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted/60" />)}
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="h-72 rounded-2xl bg-muted/60 lg:col-span-2" />
          <div className="h-72 rounded-2xl bg-muted/60" />
        </div>
        <div className="h-52 rounded-2xl bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">ড্যাশবোর্ড ওভারভিউ</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time business insights</p>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {(["7d", "30d", "90d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                range === r ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "7d" ? "৭ দিন" : r === "30d" ? "৩০ দিন" : r === "90d" ? "৯০ দিন" : "Lifetime"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="মোট আয়" value={formatBDT(data.revenue)} sub={`${range}: ${formatBDT(data.rangeRevenue)}`} tint="rose" />
        <KpiCard icon={ShoppingCart} label="মোট অর্ডার" value={data.orderCount} sub={`${range}: ${data.rangeOrders}`} tint="violet" />
        <KpiCard icon={Package} label="প্রোডাক্ট" value={data.productCount} tint="pink" />
        <KpiCard icon={Users} label="সেলার + অ্যাফিলিয়েট" value={data.sellerCount + data.affiliateCount} sub={`${data.sellerCount} sellers · ${data.affiliateCount} aff.`} tint="cyan" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">রেভিনিউ ট্রেন্ড</h3>
              <p className="text-xs text-muted-foreground">Revenue over time</p>
            </div>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.series} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" animationDuration={800} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">অর্ডার স্ট্যাটাস</h3>
              <p className="text-xs text-muted-foreground">Status breakdown</p>
            </div>
            <Award className="h-5 w-5 text-violet-400" />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.statusData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold">অর্ডার ভলিউম</h3>
            <p className="text-xs text-muted-foreground">Daily order count</p>
          </div>
          <ShoppingCart className="h-5 w-5 text-blue-400" />
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.series}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
            <Line type="monotone" dataKey="orders" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} animationDuration={800} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-amber-400" />
          <h2 className="font-display font-bold text-xl">পেন্ডিং অ্যাকশন</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <PendingStat icon={Clock} label="অর্ডার" value={data.pending.orders} />
          <PendingStat icon={Users} label="সেলার আবেদন" value={data.pending.sellers} />
          <PendingStat icon={Award} label="অ্যাফিলিয়েট আবেদন" value={data.pending.affiliates} />
          <PendingStat icon={Package} label="প্রোডাক্ট রিভিউ" value={data.pending.products} />
          <PendingStat icon={DollarSign} label="উইথড্র" value={data.pending.withdrawals} />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, gradient, iconColor }: { icon: any; label: string; value: React.ReactNode; sub?: string; gradient: string; iconColor: string }) {
  return (
    <div className={`relative glass-card rounded-2xl p-5 overflow-hidden bg-gradient-to-br ${gradient}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-display font-bold mt-1 truncate">{value}</div>
          {sub && <div className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</div>}
        </div>
        <Icon className={`h-8 w-8 ${iconColor} opacity-80`} />
      </div>
    </div>
  );
}

function PendingStat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  const hot = value > 0;
  return (
    <div className={`glass-card rounded-2xl p-4 ${hot ? "ring-2 ring-amber-400/40" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-display font-bold mt-1">{value}</div>
        </div>
        <Icon className={`h-5 w-5 ${hot ? "text-amber-400" : "text-muted-foreground"}`} />
      </div>
    </div>
  );
}
