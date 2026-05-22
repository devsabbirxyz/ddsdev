import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";

const ordersQuery = (status: string) =>
  queryOptions({
    queryKey: ["admin", "orders", status],
    queryFn: async () => {
      let q = supabase
        .from("orders")
        .select("id,order_number,product_title,customer_name,customer_email,total_price,payment_method,transaction_id,status,delivery_status,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

export const Route = createFileRoute("/_admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminOrdersList,
});

function AdminOrdersList() {
  const [status, setStatus] = useState("pending");
  const { data: orders = [], isLoading } = useQuery(ordersQuery(status));

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              status === t.key ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass-card hover:bg-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left">
                <Th>Order</Th>
                <Th>Product</Th>
                <Th>Customer</Th>
                <Th>Payment</Th>
                <Th>Total</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading...</td></tr>
              )}
              {!isLoading && orders.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">কোনো অর্ডার নেই</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border/40 hover:bg-accent/30">
                  <Td><span className="font-mono text-xs">{o.order_number}</span></Td>
                  <Td className="max-w-[200px] truncate">{o.product_title}</Td>
                  <Td>
                    <div className="text-xs">
                      <div className="font-semibold">{o.customer_name}</div>
                      <div className="text-muted-foreground">{o.customer_email}</div>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-xs">
                      <div>{o.payment_method}</div>
                      {o.transaction_id && <div className="font-mono text-muted-foreground">{o.transaction_id}</div>}
                    </div>
                  </Td>
                  <Td className="font-semibold">{formatBDT(o.total_price)}</Td>
                  <Td><StatusBadge status={o.status ?? "pending"} /></Td>
                  <Td>
                    <Link
                      to="/admin/orders/$id"
                      params={{ id: o.id }}
                      className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow"
                    >
                      Manage
                    </Link>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    approved: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[status] ?? "glass"}`}>
      {status}
    </span>
  );
}
