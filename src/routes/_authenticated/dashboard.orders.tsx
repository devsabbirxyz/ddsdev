import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Package, Star, Loader2, MessageSquarePlus, CheckCircle2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatBDT } from "@/lib/storefront";
import { submitReview } from "@/lib/reviews.functions";
import { downloadInvoicePDF } from "@/lib/invoice";

async function handleDownloadInvoice(orderId: string) {
  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (error || !data) { toast.error("ইনভয়েস লোড ব্যর্থ"); return; }
  downloadInvoicePDF(data as any);
}

const myOrdersQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["my-orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,product_id,product_title,variant_label,quantity,total_price,status,delivery_status,payment_method,is_reviewed,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/orders")({
  component: OrdersPage,
});

type OrderRow = {
  id: string;
  order_number: string;
  product_id: string | null;
  product_title: string;
  variant_label: string | null;
  quantity: number | null;
  total_price: number;
  status: string | null;
  delivery_status: string | null;
  payment_method: string;
  is_reviewed: boolean | null;
  created_at: string | null;
};

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useQuery(myOrdersQuery(user?.id));
  const [reviewing, setReviewing] = useState<OrderRow | null>(null);

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
            <div key={o.id} className="block glass-card rounded-2xl p-5 hover:shadow-glow transition">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <Link to="/order/$id" params={{ id: o.id }} className="min-w-0 flex-1">
                  <div className="font-display font-bold">{o.product_title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-mono">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {o.variant_label && <>{o.variant_label} · </>}পরিমাণ {o.quantity} · {o.payment_method}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">{new Date(o.created_at!).toLocaleString("bn-BD")}</div>
                </Link>
                <div className="text-right">
                  <div className="font-display font-bold text-xl text-gradient-brand">{formatBDT(o.total_price)}</div>
                  <StatusBadge status={o.status ?? "pending"} />
                </div>
              </div>
              {o.status === "approved" && o.product_id && (
                <div className="mt-3 pt-3 border-t border-border flex justify-end">
                  {o.is_reviewed ? (
                    <button
                      onClick={() => setReviewing(o as OrderRow)}
                      className="inline-flex items-center gap-1.5 text-xs rounded-lg glass px-3 py-1.5 hover:bg-accent"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> রিভিউ এডিট করুন
                    </button>
                  ) : (
                    <button
                      onClick={() => setReviewing(o as OrderRow)}
                      className="inline-flex items-center gap-1.5 text-xs rounded-lg bg-gradient-brand text-primary-foreground px-3 py-1.5 font-semibold shadow-glow"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" /> রিভিউ দিন
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {reviewing && (
        <ReviewModal order={reviewing} onClose={() => setReviewing(null)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "approved" ? "bg-primary/15 text-primary" : status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground";
  const lbl = status === "approved" ? "✓ সফল" : status === "rejected" ? "✗ বাতিল" : "⏳ Pending";
  return <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{lbl}</span>;
}

function ReviewModal({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  const qc = useQueryClient();
  const submit = useServerFn(submitReview);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (rating < 1) { toast.error("রেটিং দিন"); return; }
    setBusy(true);
    try {
      await submit({ data: { orderId: order.id, rating, text: text.trim() || null } });
      await qc.invalidateQueries({ queryKey: ["my-orders"] });
      await qc.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("✅ রিভিউ জমা হয়েছে — ধন্যবাদ!");
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "রিভিউ জমা ব্যর্থ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4">
      <div className="glass-card rounded-2xl p-6 w-full max-w-md space-y-4">
        <div>
          <h3 className="font-display font-bold text-lg">রিভিউ দিন</h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{order.product_title}</p>
        </div>

        <div>
          <div className="text-xs font-semibold mb-2 text-muted-foreground">আপনার রেটিং</div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(i)}
                className="p-1"
              >
                <Star className={`h-7 w-7 transition ${i <= (hover || rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">আপনার মতামত (ঐচ্ছিক)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="প্রোডাক্ট কেমন লাগলো?"
            className="w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-border">
          <button onClick={onClose} disabled={busy} className="rounded-xl glass px-4 py-2 text-sm hover:bg-accent">বাতিল</button>
          <button onClick={onSubmit} disabled={busy} className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow inline-flex items-center gap-2 disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} জমা দিন
          </button>
        </div>
      </div>
    </div>
  );
}
