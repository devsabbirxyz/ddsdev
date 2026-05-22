import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const overviewQuery = queryOptions({
  queryKey: ["affiliate", "overview"],
  queryFn: async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) throw new Error("Not authenticated");
    const { data: aff } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    if (!aff) throw new Error("Affiliate not found");
    return { affiliate: aff };
  },
});

export const Route = createFileRoute("/affiliate/")({
  head: () => ({ meta: [{ title: "Affiliate Overview — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: AffiliateOverview,
});

function AffiliateOverview() {
  const { data, isLoading } = useQuery(overviewQuery);
  if (isLoading || !data) return <div className="text-muted-foreground">Loading...</div>;
  const a = data.affiliate;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/?ref=${a.referral_code}`;

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("কপি হয়েছে");
    } catch {
      toast.error("কপি করা যায়নি");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">অ্যাফিলিয়েট ওভারভিউ</h1>
        <p className="text-sm text-muted-foreground">আপনার রেফারেল লিংক শেয়ার করুন এবং প্রতি সেলে কমিশন পান।</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="ব্যালেন্স" value={formatBDT(Number(a.balance ?? 0))} />
        <Stat label="মোট আর্নিং" value={formatBDT(Number(a.total_earnings ?? 0))} />
        <Stat label="মোট রেফারেল" value={a.total_referrals ?? 0} />
        <Stat label="উইথড্র করা" value={formatBDT(Number(a.total_withdrawn ?? 0))} />
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">আপনার রেফারেল কোড</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-lg font-bold">{a.referral_code}</code>
            <button onClick={() => copy(a.referral_code)} className="rounded-lg border border-border p-2 hover:bg-accent" aria-label="Copy code">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">শেয়ারযোগ্য লিংক</div>
          <div className="flex items-center gap-2">
            <input readOnly value={link} className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" />
            <button onClick={() => copy(link)} className="rounded-lg border border-border p-2 hover:bg-accent" aria-label="Copy link">
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          কমিশন রেট: <span className="font-mono font-semibold text-foreground">{Number(a.commission_rate ?? 0)}%</span>
        </div>
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
