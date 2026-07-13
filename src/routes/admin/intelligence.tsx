import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  Activity, TrendingUp, DollarSign, ShoppingCart, Users, Package,
  AlertTriangle, Crown, Sparkles, Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";

export const Route = createFileRoute("/admin/intelligence")({
  head: () => ({ meta: [{ title: "Intelligence Dashboard — Admin" }, { name: "robots", content: "noindex" }] }),
  component: IntelligencePage,
});

const DAY_MS = 86400_000;

function IntelligencePage() {
  const [pulse, setPulse] = useState(0);

  // Realtime: bump refetch on new order
  useEffect(() => {
    const ch = supabase
      .channel("intel-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        setPulse((n) => n + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // Core data — last 60 days for forecast + reports
  const { data, isLoading } = useQuery({
    queryKey: ["admin-intelligence", pulse],
    staleTime: 30_000,
    queryFn: async () => {
      const since60 = new Date(Date.now() - 60 * DAY_MS).toISOString();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      const last24Iso = new Date(Date.now() - DAY_MS).toISOString();

      const [ordersRes, viewsRes, productsRes] = await Promise.all([
        supabase.from("orders")
          .select("id,total_price,offer_price,quantity,status,payment_method,product_id,product_title,customer_name,customer_email,customer_phone,user_id,created_at")
          .gte("created_at", since60)
          .order("created_at", { ascending: true }),
        supabase.from("product_view_logs")
          .select("id,session_id,created_at")
          .gte("created_at", last24Iso),
        supabase.from("products")
          .select("id,title,stock_quantity,track_stock,offer_price,regular_price,is_active,status")
          .eq("is_active", true)
          .eq("status", "approved")
          .limit(2000),
      ]);

      const orders = (ordersRes.data ?? []) as any[];
      const views = (viewsRes.data ?? []) as any[];
      const products = (productsRes.data ?? []) as any[];

      // ---- LIVE (last 24h) ----
      const live = orders.filter((o) => o.created_at >= last24Iso);
      const liveRevenue = live
        .filter((o) => ["completed", "delivered", "paid", "processing", "confirmed"].includes(o.status))
        .reduce((s, o) => s + Number(o.total_price ?? 0), 0);
      const liveOrders = live.length;
      const liveVisitors = new Set(views.map((v) => v.session_id)).size;

      // Today
      const todayOrders = orders.filter((o) => o.created_at >= todayIso);
      const todayRevenue = todayOrders
        .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
        .reduce((s, o) => s + Number(o.total_price ?? 0), 0);

      // ---- DAILY BUCKETS (60 days) ----
      const daily: { day: string; revenue: number; orders: number; ts: number }[] = [];
      for (let i = 59; i >= 0; i--) {
        const d = new Date(Date.now() - i * DAY_MS); d.setHours(0, 0, 0, 0);
        daily.push({ day: d.toISOString().slice(5, 10), revenue: 0, orders: 0, ts: d.getTime() });
      }
      const bucket = new Map(daily.map((d) => [d.ts, d]));
      for (const o of orders) {
        if (o.status === "cancelled" || o.status === "refunded") continue;
        const d = new Date(o.created_at); d.setHours(0, 0, 0, 0);
        const b = bucket.get(d.getTime());
        if (b) { b.revenue += Number(o.total_price ?? 0); b.orders += 1; }
      }

      // ---- FORECAST (next 7 days, linear regression on last 30d) ----
      const recent = daily.slice(-30);
      const n = recent.length;
      const xs = recent.map((_, i) => i);
      const ys = recent.map((d) => d.revenue);
      const sumX = xs.reduce((a, b) => a + b, 0);
      const sumY = ys.reduce((a, b) => a + b, 0);
      const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
      const sumX2 = xs.reduce((a, x) => a + x * x, 0);
      const denom = n * sumX2 - sumX * sumX || 1;
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;

      const forecast: { day: string; predicted: number }[] = [];
      for (let i = 1; i <= 7; i++) {
        const d = new Date(Date.now() + i * DAY_MS);
        const predicted = Math.max(0, Math.round(intercept + slope * (n - 1 + i)));
        forecast.push({ day: d.toISOString().slice(5, 10), predicted });
      }
      const forecastTotal = forecast.reduce((s, f) => s + f.predicted, 0);
      const prevWeekTotal = recent.slice(-7).reduce((s, d) => s + d.revenue, 0);
      const forecastGrowth = prevWeekTotal > 0
        ? ((forecastTotal - prevWeekTotal) / prevWeekTotal) * 100
        : 0;

      // ---- PROFIT / LOSS (assumes 30% avg cost; adjustable) ----
      // Real cost data isn't in DB — provide sensible estimate the admin can read.
      const COST_RATIO = 0.55; // digital products ~55% cost (platform/subscription fees)
      const paidOrders = orders.filter((o) =>
        ["completed", "delivered", "paid", "processing", "confirmed"].includes(o.status),
      );
      const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
      const totalCost = Math.round(totalRevenue * COST_RATIO);
      const totalProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // ---- LOW STOCK ALERTS ----
      const lowStock = products
        .filter((p) => p.track_stock && (p.stock_quantity ?? 0) <= 5)
        .sort((a, b) => (a.stock_quantity ?? 0) - (b.stock_quantity ?? 0))
        .slice(0, 20);

      // ---- TOP CUSTOMERS ----
      const custMap = new Map<string, { name: string; email: string; phone: string; total: number; orders: number }>();
      for (const o of paidOrders) {
        const key = o.user_id || o.customer_email || o.customer_phone;
        if (!key) continue;
        const prev = custMap.get(key) ?? { name: o.customer_name || "—", email: o.customer_email || "", phone: o.customer_phone || "", total: 0, orders: 0 };
        prev.total += Number(o.total_price ?? 0);
        prev.orders += 1;
        custMap.set(key, prev);
      }
      const topCustomers = Array.from(custMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      return {
        live: { revenue: liveRevenue, orders: liveOrders, visitors: liveVisitors, todayRevenue, todayOrders: todayOrders.length },
        daily,
        forecast, forecastTotal, forecastGrowth, prevWeekTotal,
        pnl: { revenue: totalRevenue, cost: totalCost, profit: totalProfit, margin: profitMargin, costRatio: COST_RATIO },
        lowStock,
        topCustomers,
      };
    },
  });

  const combinedChart = useMemo(() => {
    if (!data) return [];
    const past = data.daily.slice(-14).map((d) => ({ day: d.day, actual: d.revenue, predicted: null as number | null }));
    const future = data.forecast.map((f) => ({ day: f.day, actual: null as number | null, predicted: f.predicted }));
    return [...past, ...future];
  }, [data]);

  if (isLoading || !data) {
    return <div className="p-8 text-center text-muted-foreground">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl inline-flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Intelligence Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Real-time analytics, AI forecast, profit & low-stock alerts</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Live · realtime sync on
        </div>
      </div>

      {/* LIVE STATS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="আজকের রেভিনিউ" value={formatBDT(data.live.todayRevenue)} sub={`${data.live.todayOrders} orders today`} color="from-emerald-500 to-green-500" />
        <StatCard icon={ShoppingCart} label="২৪ ঘন্টায় অর্ডার" value={String(data.live.orders)} sub={formatBDT(data.live.revenue) + " revenue"} color="from-blue-500 to-indigo-500" />
        <StatCard icon={Eye} label="২৪ ঘন্টায় ভিজিটর" value={String(data.live.visitors)} sub="Unique sessions" color="from-purple-500 to-fuchsia-500" />
        <StatCard icon={Activity} label="Live Status" value="Active" sub={`Last update: এখন`} color="from-orange-500 to-red-500" />
      </section>

      {/* AI FORECAST */}
      <section className="glass-card rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h2 className="font-display font-bold text-lg inline-flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> AI Sales Forecast — পরবর্তী ৭ দিন
          </h2>
          <div className="text-sm">
            Predicted: <span className="font-bold text-gradient-brand">{formatBDT(data.forecastTotal)}</span>
            {" · "}
            <span className={data.forecastGrowth >= 0 ? "text-green-500" : "text-red-500"}>
              {data.forecastGrowth >= 0 ? "▲" : "▼"} {Math.abs(data.forecastGrowth).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedChart}>
              <defs>
                <linearGradient id="actual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#actual)" name="Actual" />
              <Area type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" fill="url(#pred)" name="Forecast" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* PROFIT / LOSS */}
        <section className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-bold text-lg mb-4 inline-flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Profit / Loss Report (60d)
          </h2>
          <div className="space-y-3">
            <PnlRow label="মোট রেভিনিউ" value={formatBDT(data.pnl.revenue)} color="text-blue-500" />
            <PnlRow label={`Cost (est. ${Math.round(data.pnl.costRatio * 100)}%)`} value={`− ${formatBDT(data.pnl.cost)}`} color="text-red-500" />
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="font-bold">নেট প্রফিট</span>
              <div className="text-right">
                <div className="font-display font-bold text-2xl text-gradient-brand">{formatBDT(data.pnl.profit)}</div>
                <div className={`text-xs font-semibold ${data.pnl.margin >= 30 ? "text-green-500" : data.pnl.margin >= 15 ? "text-yellow-500" : "text-red-500"}`}>
                  Margin: {data.pnl.margin.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: "Revenue", val: data.pnl.revenue, fill: "hsl(var(--primary))" },
                { name: "Cost", val: data.pnl.cost, fill: "#ef4444" },
                { name: "Profit", val: data.pnl.profit, fill: "#10b981" },
              ]}>
                <XAxis dataKey="name" fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={11} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="val" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* LOW STOCK ALERTS */}
        <section className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-bold text-lg mb-4 inline-flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" /> Low Stock Alerts
            {data.lowStock.length > 0 && (
              <span className="ml-1 rounded-full bg-red-500/15 text-red-500 text-xs px-2 py-0.5">{data.lowStock.length}</span>
            )}
          </h2>
          {data.lowStock.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
              সব প্রোডাক্টের stock ঠিক আছে ✅
            </div>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {data.lowStock.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-xl bg-accent/30 px-3 py-2">
                  <span className="text-sm font-semibold truncate flex-1">{p.title}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    (p.stock_quantity ?? 0) === 0
                      ? "bg-red-500/20 text-red-500"
                      : (p.stock_quantity ?? 0) <= 2
                        ? "bg-orange-500/20 text-orange-500"
                        : "bg-yellow-500/20 text-yellow-500"
                  }`}>
                    {p.stock_quantity ?? 0} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* TOP CUSTOMERS */}
      <section className="glass-card rounded-2xl p-5">
        <h2 className="font-display font-bold text-lg mb-4 inline-flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" /> Top Customers (60d)
        </h2>
        {data.topCustomers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
            এখনো paid অর্ডার নেই
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2 px-2">Rank</th>
                  <th className="text-left py-2 px-2">Customer</th>
                  <th className="text-left py-2 px-2 hidden sm:table-cell">Contact</th>
                  <th className="text-right py-2 px-2">Orders</th>
                  <th className="text-right py-2 px-2">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {data.topCustomers.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-accent/20 transition">
                    <td className="py-2.5 px-2">
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs ${
                        i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                        i === 1 ? "bg-gray-400/20 text-gray-400" :
                        i === 2 ? "bg-orange-500/20 text-orange-500" :
                        "bg-muted text-muted-foreground"
                      }`}>{i + 1}</span>
                    </td>
                    <td className="py-2.5 px-2 font-semibold">{c.name}</td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground hidden sm:table-cell">
                      {c.email || c.phone || "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right">{c.orders}</td>
                    <td className="py-2.5 px-2 text-right font-bold text-primary">{formatBDT(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white mb-2`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs text-muted-foreground font-semibold">{label}</div>
      <div className="font-display font-bold text-xl mt-0.5">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function PnlRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
