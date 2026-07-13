import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";
import { bulkOrderAction } from "@/lib/admin.functions";
import { toast } from "sonner";
import { CheckCircle2, XCircle, MessageSquare, Loader2 } from "lucide-react";

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

export const Route = createFileRoute("/admin/orders/")({
  head: () => ({ meta: [{ title: "Orders — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminOrdersList,
});

function AdminOrdersList() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("pending");
  const { data: orders = [], isLoading } = useQuery(ordersQuery(status));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<null | "approve" | "reject" | "message">(null);
  const [showMsg, setShowMsg] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const bulk = useServerFn(bulkOrderAction);

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  const ids = useMemo(() => orders.map((o) => o.id), [orders]);
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id));
  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(ids));
  };
  const toggleOne = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id); else n.add(id);
    setSelected(n);
  };

  const runBulk = async (action: "approve" | "reject" | "message", extra: { reason?: string; message?: string } = {}) => {
    if (selected.size === 0) { toast.error("অন্তত ১টি অর্ডার সিলেক্ট করুন"); return; }
    setBusy(action);
    try {
      const res = await bulk({ data: { order_ids: Array.from(selected), action, ...extra } });
      const okCount = res.results.filter((r) => r.ok).length;
      const failCount = res.results.length - okCount;
      toast.success(`✅ ${okCount} সফল${failCount ? ` · ❌ ${failCount} ব্যর্থ` : ""}`);
      setSelected(new Set());
      setShowMsg(false); setShowReject(false);
      setMsgText(""); setRejectReason("");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (e: any) {
      toast.error(e.message || "Bulk action failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => { setStatus(t.key); setSelected(new Set()); }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                status === t.key ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass-card hover:bg-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2 flex-wrap items-center glass-card rounded-xl px-3 py-2">
            <span className="text-xs font-bold text-primary">{selected.size} সিলেক্টেড</span>
            <button
              disabled={busy !== null}
              onClick={() => runBulk("approve")}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              {busy === "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Bulk Approve
            </button>
            <button
              disabled={busy !== null}
              onClick={() => setShowReject(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/30 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              <XCircle className="h-3 w-3" /> Bulk Reject
            </button>
            <button
              disabled={busy !== null}
              onClick={() => setShowMsg(true)}
              className="inline-flex items-center gap-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              <MessageSquare className="h-3 w-3" /> Bulk Message
            </button>
          </div>
        )}
      </div>

      {showReject && (
        <div className="glass-card rounded-2xl p-4 space-y-3 border border-destructive/40">
          <div className="font-bold text-destructive">Bulk Reject Reason</div>
          <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2}
            className="w-full rounded-lg bg-background/60 border border-border p-2 text-sm" placeholder="কারণ লিখুন..." />
          <div className="flex gap-2">
            <button disabled={!rejectReason || busy !== null} onClick={() => runBulk("reject", { reason: rejectReason })}
              className="rounded-lg bg-destructive text-destructive-foreground px-4 py-2 text-xs font-bold disabled:opacity-50">
              Confirm Reject ({selected.size})
            </button>
            <button onClick={() => setShowReject(false)} className="rounded-lg glass-card px-4 py-2 text-xs">Cancel</button>
          </div>
        </div>
      )}
      {showMsg && (
        <div className="glass-card rounded-2xl p-4 space-y-3 border border-primary/40">
          <div className="font-bold text-primary">Bulk Message to Customers</div>
          <textarea value={msgText} onChange={(e) => setMsgText(e.target.value)} rows={3}
            className="w-full rounded-lg bg-background/60 border border-border p-2 text-sm" placeholder="আপনার মেসেজ..." />
          <div className="flex gap-2">
            <button disabled={!msgText || busy !== null} onClick={() => runBulk("message", { message: msgText })}
              className="rounded-lg bg-gradient-brand text-primary-foreground px-4 py-2 text-xs font-bold shadow-glow disabled:opacity-50">
              Send ({selected.size})
            </button>
            <button onClick={() => setShowMsg(false)} className="rounded-lg glass-card px-4 py-2 text-xs">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left">
                <Th>
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-primary" />
                </Th>
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
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">Loading...</td></tr>
              )}
              {!isLoading && orders.length === 0 && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">কোনো অর্ডার নেই</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className={`border-t border-border/40 hover:bg-accent/30 ${selected.has(o.id) ? "bg-primary/5" : ""}`}>
                  <Td>
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} className="accent-primary" />
                  </Td>
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
                      preload="intent"
                      className="inline-flex items-center rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow hover:scale-[1.03] transition cursor-pointer"
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
    completed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
  };

  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${styles[status] ?? "glass"}`}>
      {status}
    </span>
  );
}
