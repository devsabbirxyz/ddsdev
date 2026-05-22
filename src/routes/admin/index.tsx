import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";

const overviewQuery = queryOptions({
  queryKey: ["admin", "overview"],
  staleTime: 60_000,
  queryFn: async () => {
    const [orders, sellers, affiliates, products, pendingOrders, pendingSellers, pendingAffiliates, pendingProducts, pendingWithdrawalsS, pendingWithdrawalsA] = await Promise.all([
      supabase.from("orders").select("total_price", { count: "exact" }),
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
    const revenue = (orders.data ?? []).reduce((sum, o: any) => sum + Number(o.total_price ?? 0), 0);
    return {
      revenue,
      orderCount: orders.count ?? 0,
      sellerCount: sellers.count ?? 0,
      affiliateCount: affiliates.count ?? 0,
      productCount: products.count ?? 0,
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
  const { data, isLoading } = useQuery(overviewQuery);
  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;
  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">ওভারভিউ</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="মোট আয়" value={formatBDT(data.revenue)} />
        <Stat label="মোট অর্ডার" value={data.orderCount} />
        <Stat label="সেলার" value={data.sellerCount} />
        <Stat label="অ্যাফিলিয়েট" value={data.affiliateCount} />
      </div>
      <h2 className="font-display font-bold text-xl mt-8">পেন্ডিং অ্যাকশন</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat label="অর্ডার" value={data.pending.orders} accent />
        <Stat label="সেলার আবেদন" value={data.pending.sellers} accent />
        <Stat label="অ্যাফিলিয়েট আবেদন" value={data.pending.affiliates} accent />
        <Stat label="প্রোডাক্ট রিভিউ" value={data.pending.products} accent />
        <Stat label="উইথড্র" value={data.pending.withdrawals} accent />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`glass-card rounded-2xl p-5 ${accent && Number(value) > 0 ? "ring-2 ring-primary/40" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-display font-bold mt-1">{value}</div>
    </div>
  );
}
