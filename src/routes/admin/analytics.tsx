import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";
import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, ShoppingCart, Eye, Target, DollarSign,
  Package, CreditCard, BarChart3, Activity,
} from "lucide-react";

type Range = "7d" | "30d" | "90d";

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

const analyticsQuery = (range: Range) =>
  queryOptions({
    queryKey: ["admin", "analytics", range],
    staleTime: 60_000,
    queryFn: async () => {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
      const since = new Date(Date.now() - days * 86400_000).toISOString();
      const prevSince = new Date(Date.now() - 2 * days * 86400_000).toISOString();

      const [ordersRes, prevOrdersRes, viewsRes, prevViewsRes, productsRes] = await Promise.all([
        supabase.from("orders").select("id, total_price, created_at, status, payment_method, product_id, product_title, quantity").gte("created_at", since).order("created_at", { ascending: true }),
        supabase.from("orders").select("id, total_price, status").gte("created_at", prevSince).lt("created_at", since),
        supabase.from("product_view_logs").select("id, session_id, created_at").gte("created_at", since),
        supabase.from("product_view_logs").select("id, session_id").gte("created_at", prevSince).lt("created_at", since),
        supabase.from("products").select("id, title").limit(1000),
      ]);

      const orders = (ordersRes.data ?? []) as any[];
      const prevOrders = (prevOrdersRes.data ?? []) as any[];
      const views = (viewsRes.data ?? []) as any[];
      const prevViews = (prevViewsRes.data ?? []) as any[];

      const completedOrders = orders.filter((o) => o.status === "completed");
      const revenue = completedOrders.reduce((s, o) => s + Number(o.total_price ?? 0), 0);
      const prevCompleted = prevOrders.filter((o) => o.status === "completed");
      const prevRevenue = prevCompleted.reduce((s, o) => s + Number(o.total_price ?? 0), 0);

      const totalOrders = orders.length;
      const prevTotalOrders = prevOrders.length;

      const uniqueSessions = new Set(views.map((v) => v.session_id).filter(Boolean)).size;
      const prevUniqueSessions = new Set(prevViews.map((v) => v.session_id).filter(Boolean)).size;

      // Conversion rate = orders / unique sessions
      const conversionRate = uniqueSessions > 0 ? (totalOrders / uniqueSessions) * 100 : 0;
      const prevConversionRate = prevUniqueSessions > 0 ? (prevTotalOrders / prevUniqueSessions) * 100 : 0;

      const aov = completedOrders.length > 0 ? revenue / completedOrders.length : 0;
      const prevAov = prevCompleted.length > 0 ? prevRevenue / prevCompleted.length : 0;

      // Daily series
      const byDay = new Map<string, { date: string; revenue: number; orders: number; views: number }>();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000);
        const key = d.toISOString().slice(0, 10);
        byDay.set(key, { date: key.slice(5), revenue: 0, orders: 0, views: 0 });
      }
      for (const o of orders) {
        const b = byDay.get(String(o.created_at).slice(0, 10));
        if (b) {
          b.orders += 1;
          if (o.status === "completed") b.revenue += Number(o.total_price ?? 0);
        }
      }
      for (const v of views) {
        const b = byDay.get(String(v.created_at).slice(0, 10));
        if (b) b.views += 1;
      }
      const series = Array.from(byDay.values());

      // Conversion series
      const convSeries = series.map((d) => ({
        date: d.date,
        rate: d.views > 0 ? Number(((d.orders / d.views) * 100).toFixed(2)) : 0,
      }));

      // Payment method breakdown
      const pmMap: Record<string, number> = {};
      for (const o of completedOrders) {
        const k = o.payment_method || "unknown";
        pmMap[k] = (pmMap[k] ?? 0) + Number(o.total_price ?? 0);
      }
      const paymentData = Object.entries(pmMap).map(([name, value]) => ({ name, value: Math.round(value) }));

      // Top products
      const prodMap: Record<string, { title: string; revenue: number; qty: number }> = {};
      for (const o of completedOrders) {
        const key = o.product_id || o.product_title || "unknown";
        const title = o.product_title || "Unknown";
        if (!prodMap[key]) prodMap[key] = { title, revenue: 0, qty: 0 };
        prodMap[key].revenue += Number(o.total_price ?? 0);
        prodMap[key].qty += Number(o.quantity ?? 1);
      }
      const topProducts = Object.values(prodMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8);

      // Status funnel
      const statusMap: Record<string, number> = {};
      for (const o of orders) statusMap[o.status ?? "pending"] = (statusMap[o.status ?? "pending"] ?? 0) + 1;
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      const pctChange = (cur: number, prev: number) => {
        if (prev === 0) return cur > 0 ? 100 : 0;
        return ((cur - prev) / prev) * 100;
      };

      return {
        revenue,
        revenueChange: pctChange(revenue, prevRevenue),
        totalOrders,
        ordersChange: pctChange(totalOrders, prevTotalOrders),
        completedOrders: completedOrders.length,
        uniqueSessions,
        viewsChange: pctChange(uniqueSessions, prevUniqueSessions),
        conversionRate,
        conversionChange: pctChange(conversionRate, prevConversionRate),
        aov,
        aovChange: pctChange(aov, prevAov),
        series,
        convSeries,
        paymentData,
        topProducts,
        statusData,
      };
    },
  });

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — DDS-Admin" }, { name: "robots", content: "noindex" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30d");
  const { data, isLoading } = useQuery(analyticsQuery(range));

  if (isLoading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 rounded-lg bg-muted" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-muted/60" />)}
        </div>
        <div className="h-80 rounded-2xl bg-muted/60" />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl bg-muted/60" />
          <div className="h-72 rounded-2xl bg-muted/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">অ্যানালিটিক্স ড্যাশবোর্ড</h1>
          <p className="text-sm text-muted-foreground mt-1">Sales, conversion rate & deep insights</p>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                range === r ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "7d" ? "৭ দিন" : r === "30d" ? "৩০ দিন" : "৯০ দিন"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={DollarSign} label="রেভিনিউ" value={formatBDT(data.revenue)} change={data.revenueChange} tint="amber" />
        <Kpi icon={ShoppingCart} label="অর্ডার" value={data.totalOrders} change={data.ordersChange} tint="violet" />
        <Kpi icon={Target} label="কনভার্শন রেট" value={`${data.conversionRate.toFixed(2)}%`} change={data.conversionChange} tint="teal" />
        <Kpi icon={BarChart3} label="গড় অর্ডার ভ্যালু" value={formatBDT(data.aov)} change={data.aovChange} tint="cyan" />
      </div>

      {/* Sales chart */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold">সেলস ট্রেন্ড</h3>
            <p className="text-xs text-muted-foreground">Revenue & orders over time</p>
          </div>
          <TrendingUp className="h-5 w-5 text-emerald-400" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data.series}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area yAxisId="left" type="monotone" dataKey="revenue" name="রেভিনিউ" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revGrad)" />
            <Area yAxisId="right" type="monotone" dataKey="orders" name="অর্ডার" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#ordGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion + Views */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">কনভার্শন রেট ট্রেন্ড</h3>
              <p className="text-xs text-muted-foreground">Daily orders ÷ views</p>
            </div>
            <Target className="h-5 w-5 text-teal-400" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.convSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: any) => `${v}%`} />
              <Line type="monotone" dataKey="rate" name="Rate" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">প্রোডাক্ট ভিউ</h3>
              <p className="text-xs text-muted-foreground">Unique sessions: {data.uniqueSessions.toLocaleString()}</p>
            </div>
            <Eye className="h-5 w-5 text-cyan-400" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="views" name="Views" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payment method + Status */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">পেমেন্ট মেথড</h3>
              <p className="text-xs text-muted-foreground">Revenue share by method</p>
            </div>
            <CreditCard className="h-5 w-5 text-violet-400" />
          </div>
          {data.paymentData.length === 0 ? (
            <div className="h-[240px] grid place-items-center text-sm text-muted-foreground">কোনো ডাটা নেই</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} innerRadius={45} paddingAngle={2}>
                  {data.paymentData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} formatter={(v: any) => formatBDT(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold">অর্ডার স্ট্যাটাস</h3>
              <p className="text-xs text-muted-foreground">Funnel breakdown</p>
            </div>
            <Activity className="h-5 w-5 text-amber-400" />
          </div>
          {data.statusData.length === 0 ? (
            <div className="h-[240px] grid place-items-center text-sm text-muted-foreground">কোনো ডাটা নেই</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top products */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold">টপ প্রোডাক্ট</h3>
            <p className="text-xs text-muted-foreground">Best sellers by revenue</p>
          </div>
          <Package className="h-5 w-5 text-emerald-400" />
        </div>
        {data.topProducts.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">এই সময়ে কোনো বিক্রি নেই</div>
        ) : (
          <div className="space-y-3">
            {data.topProducts.map((p, idx) => {
              const max = data.topProducts[0].revenue || 1;
              const pct = (p.revenue / max) * 100;
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm gap-3">
                    <span className="font-medium truncate flex items-center gap-2">
                      <span className="inline-grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary text-xs font-bold shrink-0">{idx + 1}</span>
                      <span className="truncate">{p.title}</span>
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">{p.qty} pcs · <span className="text-foreground font-semibold">{formatBDT(p.revenue)}</span></span>
                  </div>
                  <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, change, tint }: { icon: any; label: string; value: React.ReactNode; change: number; tint: "teal" | "violet" | "cyan" | "amber" }) {
  const tints: Record<string, string> = {
    amber: "from-orange-400 to-amber-600",
    violet: "from-violet-500 to-indigo-700",
    teal: "from-teal-400 to-emerald-600",
    cyan: "from-cyan-400 to-sky-600",
  };
  const up = change >= 0;
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-display font-bold leading-tight mt-2 truncate">{value}</div>
          <div className={`inline-flex items-center gap-1 mt-2 text-[11px] font-semibold ${up ? "text-emerald-400" : "text-rose-400"}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}% <span className="text-muted-foreground/70 font-normal">vs prev period</span>
          </div>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tints[tint]} shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}
