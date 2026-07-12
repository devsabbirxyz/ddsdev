import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";
import { Receipt, BarChart3, Clock, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

const overviewQuery = queryOptions({
  queryKey: ["admin", "overview", "v2"],
  staleTime: 60_000,
  queryFn: async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const chartStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13).toISOString();

    const [today, month, pending, customers, chart, recent, topRows] = await Promise.all([
      supabase.from("orders").select("total_price", { count: "exact" }).gte("created_at", startOfDay),
      supabase.from("orders").select("total_price").gte("created_at", startOfMonth),
      supabase.from("orders").select("total_price", { count: "exact" }).eq("status", "pending"),
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total_price,created_at,status").gte("created_at", chartStart),
      supabase.from("orders").select("id,order_number,product_title,total_price,status,created_at").order("created_at", { ascending: false }).limit(6),
      supabase.from("orders").select("product_title,total_price,status").eq("status", "approved").limit(500),
    ]);

    const sum = (rows: any[] | null) => (rows ?? []).reduce((s, o) => s + Number(o.total_price ?? 0), 0);

    // Build 14-day series
    const days: { day: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const rev = (chart.data ?? [])
        .filter((r: any) => r.created_at?.slice(0, 10) === key && r.status === "approved")
        .reduce((s: number, r: any) => s + Number(r.total_price ?? 0), 0);
      days.push({ day: label, revenue: rev });
    }

    // Top products by revenue
    const agg = new Map<string, { title: string; revenue: number; orders: number }>();
    for (const r of (topRows.data ?? []) as any[]) {
      const t = r.product_title ?? "Unknown";
      const cur = agg.get(t) ?? { title: t, revenue: 0, orders: 0 };
      cur.revenue += Number(r.total_price ?? 0);
      cur.orders += 1;
      agg.set(t, cur);
    }
    const top = Array.from(agg.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    return {
      todaySales: sum(today.data as any),
      todayOrders: today.count ?? 0,
      monthSales: sum(month.data as any),
      totalDue: sum(pending.data as any),
      pendingCount: pending.count ?? 0,
      customers: customers.count ?? 0,
      chart: days,
      recent: (recent.data ?? []) as any[],
      top,
    };
  },
});

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Overview — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: AdminOverview,
});

function AdminOverview() {
  const { data, isLoading } = useQuery(overviewQuery);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">আপনার স্টোরের এক নজরে</p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard accent="purple" icon={Receipt} label="TODAY'S SALES" value={isLoading ? "—" : formatBDT(data?.todaySales ?? 0)} meta={`${data?.todayOrders ?? 0} orders today`} />
        <StatCard accent="blue" icon={BarChart3} label="THIS MONTH" value={isLoading ? "—" : formatBDT(data?.monthSales ?? 0)} meta="Total revenue" />
        <StatCard accent="amber" icon={Clock} label="TOTAL DUE" value={isLoading ? "—" : formatBDT(data?.totalDue ?? 0)} meta={`${data?.pendingCount ?? 0} pending orders`} />
        <StatCard accent="emerald" icon={Users} label="CUSTOMERS" value={isLoading ? "—" : (data?.customers ?? 0).toLocaleString()} meta="Registered users" />
      </div>

      {/* Chart + Top products */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl bg-card border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-display font-bold text-lg">Revenue Overview</div>
              <div className="text-xs text-muted-foreground">Last 14 days</div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400"><TrendingUp className="h-3.5 w-3.5" /> Live</div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.chart ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.24 295)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="oklch(0.62 0.24 295)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} width={44} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.18 0.04 282)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                  formatter={(v: any) => [formatBDT(Number(v)), "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="oklch(0.75 0.20 300)" strokeWidth={2.5} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-white/10 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-bold text-lg">Top Selling Products</div>
            <Link to="/admin/products" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">All <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
          <div className="space-y-3">
            {(data?.top ?? []).length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">এখনো ডেটা নেই</div>
            )}
            {(data?.top ?? []).map((p, i) => (
              <div key={p.title} className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand text-primary-foreground font-bold text-sm shrink-0">{i + 1}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{p.title}</div>
                  <div className="text-[11px] text-muted-foreground">{p.orders} orders</div>
                </div>
                <div className="text-sm font-bold shrink-0">{formatBDT(p.revenue)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-2xl bg-card border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-bold text-lg">Recent Transactions</div>
          <Link to="/admin/orders" className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">View all <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground border-b border-white/5">
                <th className="py-2.5 font-semibold">Order</th>
                <th className="py-2.5 font-semibold">Product</th>
                <th className="py-2.5 font-semibold">Date</th>
                <th className="py-2.5 font-semibold">Status</th>
                <th className="py-2.5 font-semibold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recent ?? []).length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">এখনো অর্ডার নেই</td></tr>
              )}
              {(data?.recent ?? []).map((o) => (
                <tr key={o.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                  <td className="py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="py-3 max-w-[220px] truncate">{o.product_title}</td>
                  <td className="py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="py-3"><StatusBadge status={o.status ?? "pending"} /></td>
                  <td className="py-3 font-bold text-right">{formatBDT(o.total_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/25",
    rejected: "bg-rose-500/15 text-rose-400 border-rose-500/25",
  };
  const lbl: Record<string, string> = { approved: "Paid", pending: "Pending", rejected: "Rejected" };
  const cls = map[status] ?? "bg-muted text-muted-foreground border-white/10";
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${cls}`}>{lbl[status] ?? status}</span>;
}

const accents: Record<string, string> = {
  purple: "var(--admin-accent-purple)",
  blue: "var(--admin-accent-blue)",
  amber: "var(--admin-accent-amber)",
  emerald: "var(--admin-accent-emerald)",
};

function StatCard({
  accent, icon: Icon, label, value, meta,
}: {
  accent: "purple" | "blue" | "amber" | "emerald";
  icon: any; label: string; value: React.ReactNode; meta: string;
}) {
  return (
    <div className="stat-card" style={{ ["--stat-accent" as any]: accents[accent] }}>
      <div className="flex items-start justify-between gap-3">
        <div className="stat-icon"><Icon className="h-5 w-5" /></div>
      </div>
      <div className="mt-4">
        <div className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground">{label}</div>
        <div className="text-3xl font-display font-bold mt-1.5 leading-none truncate">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-2">{meta}</div>
      </div>
    </div>
  );
}
