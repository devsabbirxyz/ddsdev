import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";

const sellerOrdersQuery = queryOptions({
  queryKey: ["seller", "orders"],
  queryFn: async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return [];
    const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", uid).maybeSingle();
    if (!seller) return [];
    const { data, error } = await supabase
      .from("orders")
      .select("id,order_number,product_title,customer_name,total_price,status,seller_earning,created_at")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/_seller/orders")({
  head: () => ({ meta: [{ title: "Seller Orders — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: SellerOrders,
});

function SellerOrders() {
  const { data: orders = [], isLoading } = useQuery(sellerOrdersQuery);
  return (
    <div className="space-y-4">
      <h1 className="font-display font-bold text-2xl">আমার অর্ডার</h1>
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase">Order</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Product</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Customer</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Total</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Earning</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading...</td></tr>}
              {!isLoading && orders.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">কোনো অর্ডার নেই</td></tr>}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate">{o.product_title}</td>
                  <td className="px-4 py-3">{o.customer_name}</td>
                  <td className="px-4 py-3 font-semibold">{formatBDT(Number(o.total_price))}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-400">{formatBDT(Number(o.seller_earning ?? 0))}</td>
                  <td className="px-4 py-3 text-xs">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
