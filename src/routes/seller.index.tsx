import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { formatBDT } from "@/lib/storefront";
import { getMySellerOverview } from "@/lib/seller-owner.functions";

const overviewQuery = queryOptions({
  queryKey: ["seller", "overview"],
  queryFn: async () => {
    const res = await getMySellerOverview();
    if (!res?.seller) throw new Error("Seller not found");
    return res;
  },
});

export const Route = createFileRoute("/seller/")({
  head: () => ({ meta: [{ title: "Seller Overview — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: SellerOverview,
});

function SellerOverview() {
  const { data, isLoading } = useQuery(overviewQuery);
  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;
  const s = data.seller;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">{s.store_name}</h1>
        <p className="text-sm text-muted-foreground">{s.store_description ?? "স্টোর ডেসক্রিপশন এখনো যোগ করা হয়নি।"}</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="ব্যালেন্স" value={formatBDT(Number(s.balance ?? 0))} />
        <Stat label="মোট আর্নিং" value={formatBDT(Number(s.total_earnings ?? 0))} />
        <Stat label="মোট প্রোডাক্ট" value={data.productCount} />
        <Stat label="মোট অর্ডার" value={data.orderCount} />
      </div>
      <div className="glass-card rounded-2xl p-5 text-sm">
        <div className="font-semibold mb-1">কমিশন রেট</div>
        <div className="text-muted-foreground">প্ল্যাটফর্ম কমিশন: <span className="font-mono">{Number(s.commission_rate ?? 0)}%</span></div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-display font-bold mt-1">{value}</div>
    </div>
  );
}
