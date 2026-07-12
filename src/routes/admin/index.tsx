import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";
import { Receipt, BarChart3, Clock, Users } from "lucide-react";

const overviewQuery = queryOptions({
  queryKey: ["admin", "overview", "stat4"],
  staleTime: 60_000,
  queryFn: async () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [today, month, pending, customers] = await Promise.all([
      supabase.from("orders").select("total_price", { count: "exact" }).gte("created_at", startOfDay),
      supabase.from("orders").select("total_price").gte("created_at", startOfMonth),
      supabase.from("orders").select("total_price", { count: "exact" }).eq("status", "pending"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    const sum = (rows: any[] | null) => (rows ?? []).reduce((s, o) => s + Number(o.total_price ?? 0), 0);

    return {
      todaySales: sum(today.data as any),
      todayOrders: today.count ?? 0,
      monthSales: sum(month.data as any),
      totalDue: sum(pending.data as any),
      pendingCount: pending.count ?? 0,
      customers: customers.count ?? 0,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">আপনার স্টোরের এক নজরে</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-foreground bg-gradient-brand shadow-glow hover:scale-[1.02] transition"
          >
            <span className="text-lg leading-none">+</span> New Product
          </Link>
          <Link
            to="/admin/coupons"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold border border-white/15 hover:bg-white/5 transition"
          >
            New Coupon
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          accent="purple"
          icon={Receipt}
          label="TODAY'S SALES"
          value={isLoading ? "—" : formatBDT(data?.todaySales ?? 0)}
          meta={`${data?.todayOrders ?? 0} orders today`}
        />
        <StatCard
          accent="blue"
          icon={BarChart3}
          label="THIS MONTH"
          value={isLoading ? "—" : formatBDT(data?.monthSales ?? 0)}
          meta="Total revenue"
        />
        <StatCard
          accent="amber"
          icon={Clock}
          label="TOTAL DUE"
          value={isLoading ? "—" : formatBDT(data?.totalDue ?? 0)}
          meta={`${data?.pendingCount ?? 0} pending orders`}
        />
        <StatCard
          accent="emerald"
          icon={Users}
          label="CUSTOMERS"
          value={isLoading ? "—" : (data?.customers ?? 0).toLocaleString()}
          meta="Registered users"
        />
      </div>
    </div>
  );
}

const accents: Record<string, string> = {
  purple: "var(--admin-accent-purple)",
  blue: "var(--admin-accent-blue)",
  amber: "var(--admin-accent-amber)",
  emerald: "var(--admin-accent-emerald)",
};

function StatCard({
  accent,
  icon: Icon,
  label,
  value,
  meta,
}: {
  accent: "purple" | "blue" | "amber" | "emerald";
  icon: any;
  label: string;
  value: React.ReactNode;
  meta: string;
}) {
  return (
    <div className="stat-card" style={{ ["--stat-accent" as any]: accents[accent] }}>
      <div className="flex items-start justify-between gap-3">
        <div className="stat-icon">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-[10px] font-semibold tracking-[0.15em] text-muted-foreground">{label}</div>
        <div className="text-3xl font-display font-bold mt-1.5 leading-none truncate">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-2">{meta}</div>
      </div>
    </div>
  );
}
