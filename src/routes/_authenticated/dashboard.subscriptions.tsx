import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { formatBDT } from "@/lib/storefront";
import {
  listMySubscriptions,
  toggleAutoRenew,
  cancelSubscription,
} from "@/lib/subscriptions.functions";
import { CalendarClock, X, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/subscriptions")({
  head: () => ({ meta: [{ title: "আমার সাবস্ক্রিপশন — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: SubscriptionsPage,
});

function statusLabel(s: string) {
  switch (s) {
    case "active": return { label: "সক্রিয়", color: "bg-emerald-500/15 text-emerald-400" };
    case "expired": return { label: "মেয়াদ শেষ", color: "bg-orange-500/15 text-orange-400" };
    case "cancelled": return { label: "বাতিল", color: "bg-red-500/15 text-red-400" };
    case "pending_renewal": return { label: "নবায়নের অপেক্ষায়", color: "bg-blue-500/15 text-blue-400" };
    default: return { label: s, color: "bg-muted text-muted-foreground" };
  }
}

function daysLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function SubscriptionsPage() {
  const list = useServerFn(listMySubscriptions);
  const toggle = useServerFn(toggleAutoRenew);
  const cancel = useServerFn(cancelSubscription);
  const qc = useQueryClient();

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ["my-subscriptions"],
    queryFn: () => list({}),
  });

  const toggleMut = useMutation({
    mutationFn: (v: { id: string; autoRenew: boolean }) =>
      toggle({ data: v }),
    onSuccess: () => {
      toast.success("আপডেট হয়েছে");
      qc.invalidateQueries({ queryKey: ["my-subscriptions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancel({ data: { id } }),
    onSuccess: () => {
      toast.success("সাবস্ক্রিপশন বাতিল করা হয়েছে");
      qc.invalidateQueries({ queryKey: ["my-subscriptions"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl">আমার সাবস্ক্রিপশন</h1>
        <p className="text-sm text-muted-foreground">সক্রিয় ও মেয়াদ-শেষ সাবস্ক্রিপশন পরিচালনা করুন</p>
      </div>

      {isLoading && (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">লোড হচ্ছে...</div>
      )}

      {!isLoading && subs.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <CalendarClock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold mb-1">কোনো সাবস্ক্রিপশন নেই</p>
          <p className="text-sm text-muted-foreground mb-4">আমাদের সাবস্ক্রিপশন প্রোডাক্ট কিনে শুরু করুন</p>
          <Link to="/shop" className="text-primary font-semibold underline">শপ দেখুন</Link>
        </div>
      )}

      <div className="space-y-3">
        {subs.map((s: any) => {
          const st = statusLabel(s.status);
          const dl = daysLeft(s.expires_at);
          const isActive = s.status === "active";
          return (
            <div key={s.id} className="glass-card rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                    {isActive && dl <= 7 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400">
                        {dl} দিন বাকি
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold mt-1.5 truncate">
                    {s.product?.slug ? (
                      <Link to="/product/$slug" params={{ slug: s.product.slug }} className="hover:text-primary">
                        {s.product?.title ?? "প্রোডাক্ট"}
                      </Link>
                    ) : (
                      s.product?.title ?? "প্রোডাক্ট"
                    )}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {s.plan?.name} · {formatBDT(Number(s.plan?.price ?? 0))} / {s.plan?.duration_days} দিন
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">শুরু</div>
                  <div className="font-semibold">{new Date(s.started_at).toLocaleDateString("bn-BD")}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">মেয়াদ শেষ</div>
                  <div className="font-semibold">{new Date(s.expires_at).toLocaleDateString("bn-BD")}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={s.auto_renew}
                    disabled={!isActive || toggleMut.isPending}
                    onCheckedChange={(v) => toggleMut.mutate({ id: s.id, autoRenew: v })}
                  />
                  <span className="text-sm flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5" />
                    অটো-রিনিউ
                  </span>
                </div>
                {isActive && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={cancelMut.isPending}
                    onClick={() => {
                      if (confirm("আপনি কি নিশ্চিত? সাবস্ক্রিপশন বাতিল হলে আর রিনিউ হবে না।")) {
                        cancelMut.mutate(s.id);
                      }
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> বাতিল করুন
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
