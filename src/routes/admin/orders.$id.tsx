import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, FileText, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";
import { deliverOrder, rejectOrder, sendOrderMessage } from "@/lib/delivery.functions";
import { downloadInvoicePDF } from "@/lib/invoice";

const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["admin", "order", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

const productQuery = (id: string | null | undefined) =>
  queryOptions({
    queryKey: ["admin", "order-product", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return null;
      const { getOrderProductForAdmin } = await import("@/lib/admin.functions");
      return await getOrderProductForAdmin({ data: { id } });
    },
  });

const stockQuery = (productId: string | null | undefined, variantId: string | null | undefined) =>
  queryOptions({
    queryKey: ["admin", "account-stock", productId, variantId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return 0;
      let q = supabase
        .from("product_accounts")
        .select("id", { count: "exact", head: true })
        .eq("product_id", productId)
        .eq("is_sold", false);
      if (variantId) q = q.eq("variant_id", variantId);
      const { count, error } = await q;
      if (error) throw error;
      return count ?? 0;
    },
  });

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const nav = useNavigate();
  const deliver = useServerFn(deliverOrder);
  const reject = useServerFn(rejectOrder);
  const sendMsg = useServerFn(sendOrderMessage);

  const { data: order, isLoading } = useQuery(orderQuery(id));
  const { data: product } = useQuery(productQuery(order?.product_id));
  const { data: stock } = useQuery(stockQuery(order?.product_id, order?.variant_id));

  const [submitting, setSubmitting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [customMsg, setCustomMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  if (isLoading) return <p className="text-center text-muted-foreground py-12">Loading...</p>;
  if (!order) return <p className="text-center py-12">Order not found</p>;

  const isPending = order.status === "pending";

  const onApprove = async () => {
    if (product?.delivery_type === "account" && (stock ?? 0) < (order.quantity ?? 1)) {
      toast.error(`Account stock কম! দরকার ${order.quantity}, আছে ${stock ?? 0}`);
      return;
    }
    setSubmitting(true);
    try {
      await deliver({ data: { orderId: order.id } });
      await qc.refetchQueries({ queryKey: ["admin"], type: "all" });
      toast.success("অর্ডার ডেলিভার হয়েছে!");
      nav({ to: "/admin/orders" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const onReject = async () => {
    if (!reason.trim()) { toast.error("কারণ লিখুন"); return; }
    setRejecting(true);
    try {
      await reject({ data: { orderId: order.id, reason: reason.trim() } });
      await qc.refetchQueries({ queryKey: ["admin"], type: "all" });
      toast.success("অর্ডার বাতিল");
      nav({ to: "/admin/orders" });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <button
          onClick={() => downloadInvoicePDF(order as any)}
          className="inline-flex items-center gap-2 rounded-xl glass-card px-4 py-2 text-sm font-semibold hover:bg-accent"
        >
          <FileText className="h-4 w-4" /> Invoice PDF
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display font-bold text-xl">{order.product_title}</h2>
            <p className="text-xs text-muted-foreground font-mono mt-1">{order.order_number}</p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
            order.status === "approved" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
            order.status === "rejected" ? "bg-destructive/15 text-destructive border-destructive/30" :
            "bg-amber-500/15 text-amber-300 border-amber-500/30"
          }`}>{order.status}</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm pt-3 border-t border-border">
          <Row label="Customer" value={`${order.customer_name} · ${order.customer_email}`} />
          <Row label="Phone" value={order.customer_phone ?? "—"} />
          <Row label="Payment" value={`${order.payment_method} (${order.payment_type})`} />
          <Row label="TrxID" value={order.transaction_id ?? "—"} mono />
          {order.variant_label && <Row label="Variant" value={order.variant_label} />}
          <Row label="Quantity" value={String(order.quantity)} />
          <Row label="Total" value={formatBDT(order.total_price)} />
          {order.coupon_code && <Row label="Coupon" value={`${order.coupon_code} (− ${formatBDT(order.discount_amount)})`} />}
        </div>
        {order.customer_input && (
          <div className="pt-3 border-t border-border">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Customer input</div>
            <pre className="whitespace-pre-wrap text-sm bg-background/40 rounded-xl p-3">{order.customer_input}</pre>
          </div>
        )}
      </div>

      {product && (
        <div className="glass-card rounded-2xl p-6 space-y-2">
          <h3 className="font-display font-bold">Delivery info</h3>
          <Row label="Type" value={product.delivery_type} />
          {product.delivery_type === "account" && (
            <Row label="Available stock" value={`${stock ?? 0} accounts`} />
          )}
          {product.delivery_content && product.delivery_type !== "account" && (
            <div className="pt-2">
              <div className="text-xs font-semibold text-muted-foreground mb-1">Will deliver this content:</div>
              <pre className="whitespace-pre-wrap text-sm bg-background/40 rounded-xl p-3 font-mono">{product.delivery_content}</pre>
            </div>
          )}
        </div>
      )}

      {order.delivery_content && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-display font-bold mb-2">Delivered content</h3>
          <pre className="whitespace-pre-wrap text-sm bg-background/40 rounded-xl p-3 font-mono">{order.delivery_content}</pre>
        </div>
      )}

      {isPending && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-bold">Actions</h3>
          <button
            onClick={onApprove}
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.01] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve & Deliver
          </button>
          <div className="border-t border-border pt-4 space-y-2">
            <label className="text-xs font-semibold">Reject reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="ভুল TrxID / টাকা পাইনি / ইত্যাদি"
              className="w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-destructive/40"
            />
            <button
              onClick={onReject}
              disabled={rejecting}
              className="w-full rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-6 py-2.5 text-sm font-bold hover:bg-destructive/20 transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {rejecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Reject Order
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 space-y-3">
        <div>
          <h3 className="font-display font-bold">Customer কে মেসেজ পাঠান</h3>
          <p className="text-xs text-muted-foreground mt-1">এই মেসেজ Customer এর Dashboard → Notifications এ দেখাবে।</p>
        </div>
        <textarea
          value={customMsg}
          onChange={(e) => setCustomMsg(e.target.value)}
          rows={3}
          placeholder="যেমন: আপনার অর্ডার প্রস্তুত হচ্ছে, শীঘ্রই পেয়ে যাবেন।"
          className="w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={async () => {
            if (!customMsg.trim()) { toast.error("মেসেজ লিখুন"); return; }
            setSendingMsg(true);
            try {
              await sendMsg({ data: { orderId: order.id, message: customMsg.trim() } });
              toast.success("মেসেজ পাঠানো হয়েছে ✅");
              setCustomMsg("");
            } catch (e: any) {
              toast.error(e?.message ?? "Failed");
            } finally {
              setSendingMsg(false);
            }
          }}
          disabled={sendingMsg}
          className="w-full rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.01] transition disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {sendingMsg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          মেসেজ পাঠান
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
