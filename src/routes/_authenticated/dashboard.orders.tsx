import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatBDT } from "@/lib/storefront";

const myOrdersQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["my-orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,product_title,variant_label,quantity,total_price,status,delivery_status,payment_method,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useQuery(myOrdersQuery(user?.id));

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6">আমার অর্ডার</h1>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">লোড হচ্ছে...</div>
      ) : orders.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">এখনো কোনো অর্ডার নেই</p>
          <Link to="/shop" className="mt-4 inline-block rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">শপিং শুরু করুন</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} to="/order/$id" params={{ id: o.id }} className="block glass-card rounded-2xl p-5 hover:shadow-glow transition">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="font-display font-bold">{o.product_title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-mono">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {o.variant_label && <>{o.variant_label} · </>}পরিমাণ {o.quantity} · {o.payment_method}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{new Date(o.created_at!).toLocaleString("bn-BD")}</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-xl text-gradient-brand">{formatBDT(o.total_price)}</div>
                  <StatusBadge status={o.status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "approved" ? "bg-primary/15 text-primary" : status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground";
  const lbl = status === "approved" ? "✓ সফল" : status === "rejected" ? "✗ বাতিল" : "⏳ Pending";
  return <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{lbl}</span>;
}
