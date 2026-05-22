import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { CheckCircle2, Clock, Package, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";

const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/_authenticated/order/$id")({
  head: () => ({ meta: [{ title: "অর্ডার বিস্তারিত — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const { data: order, isLoading } = useQuery(orderQuery(id));

  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground">লোড হচ্ছে...</div>;
  if (!order) return <div className="mx-auto max-w-3xl px-4 py-16 text-center">অর্ডার পাওয়া যায়নি</div>;

  const isApproved = order.status === "approved";
  const isPending = order.status === "pending";
  const isRejected = order.status === "rejected";

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <div className={`mx-auto h-20 w-20 grid place-items-center rounded-full mb-4 ${isApproved ? "bg-gradient-brand shadow-glow" : isRejected ? "bg-destructive/20" : "glass-card"}`}>
          {isApproved ? <CheckCircle2 className="h-10 w-10 text-primary-foreground" /> : isRejected ? <Package className="h-10 w-10 text-destructive" /> : <Clock className="h-10 w-10 text-primary" />}
        </div>
        <h1 className="font-display font-bold text-3xl">
          {isApproved ? "অর্ডার সফল!" : isRejected ? "অর্ডার বাতিল" : "অর্ডার Pending"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          অর্ডার নম্বর: <span className="font-mono font-bold text-foreground">{order.order_number}</span>
        </p>
        {isPending && <p className="mt-2 text-sm text-muted-foreground">অ্যাডমিন verify করার পর প্রোডাক্ট deliver হবে — সাধারণত ১-৬ ঘণ্টা।</p>}
        {isRejected && order.rejection_reason && <p className="mt-2 text-sm text-destructive">কারণ: {order.rejection_reason}</p>}
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-3">
        <Row label="প্রোডাক্ট" value={order.product_title} />
        {order.variant_label && <Row label="ভ্যারিয়েন্ট" value={order.variant_label} />}
        <Row label="পরিমাণ" value={String(order.quantity)} />
        <Row label="পেমেন্ট মেথড" value={order.payment_method} />
        {order.transaction_id && <Row label="TrxID" value={order.transaction_id} mono />}
        {order.coupon_code && <Row label="কুপন" value={order.coupon_code} />}
        {Number(order.discount_amount ?? 0) > 0 && <Row label="ছাড়" value={`− ${formatBDT(order.discount_amount)}`} />}
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-bold">মোট</span>
          <span className="font-display font-bold text-xl text-gradient-brand">{formatBDT(order.total_price)}</span>
        </div>
      </div>

      {isApproved && order.delivery_content && (
        <div className="mt-6 glass-card rounded-2xl p-6">
          <h2 className="font-display font-bold text-lg mb-3 inline-flex items-center gap-2"><Download className="h-5 w-5 text-primary" /> ডেলিভারি বিস্তারিত</h2>
          <pre className="whitespace-pre-wrap break-words text-sm font-mono bg-background/40 rounded-xl p-4">{order.delivery_content}</pre>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Link to="/dashboard/orders" className="rounded-xl glass-card px-5 py-2.5 text-sm font-semibold hover:bg-accent">সব অর্ডার দেখুন</Link>
        <Link to="/shop" className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">আরো শপিং করুন</Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
