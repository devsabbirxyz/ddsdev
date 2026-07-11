import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Check, Users, Gift, Share2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getMyReferralInfo } from "@/lib/referral.functions";

export const Route = createFileRoute("/_authenticated/dashboard/referrals")({
  head: () => ({ meta: [{ title: "রেফার ও আয় — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const getInfo = useServerFn(getMyReferralInfo);
  const { data, isLoading } = useQuery({ queryKey: ["my-referrals"], queryFn: () => getInfo() });
  const [copied, setCopied] = useState(false);

  const link = typeof window !== "undefined" && data?.referral_code
    ? `${window.location.origin}/?ref=${data.referral_code}`
    : "";

  const copyLink = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("লিঙ্ক কপি হয়েছে!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("কপি করা যায়নি"); }
  };

  const share = async () => {
    if (!link) return;
    const text = `DDS-Digital-এ সাইন আপ করে ${data?.reward_points ?? 50} পয়েন্ট বোনাস পান! ${link}`;
    if (navigator.share) {
      try { await navigator.share({ title: "DDS-Digital", text, url: link }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("শেয়ার টেক্সট কপি হয়েছে!");
    }
  };

  if (isLoading || !data) {
    return <div className="text-muted-foreground">লোড হচ্ছে...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">রেফার করুন, আয় করুন</h1>
        <p className="text-sm text-muted-foreground mt-1">
          প্রতিটি সফল রেফারেলে আপনি <span className="font-bold text-primary">{data.reward_points} পয়েন্ট</span> পাবেন,
          আপনার বন্ধুও পাবে <span className="font-bold text-primary">{data.reward_points} পয়েন্ট</span>।
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "মোট রেফারেল", value: data.total_referrals },
          { icon: TrendingUp, label: "সফল রেফারেল", value: data.completed_referrals },
          { icon: Gift, label: "মোট পয়েন্ট আয়", value: data.total_earned },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow shrink-0">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="font-display font-bold text-2xl">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="text-xs font-bold uppercase tracking-wider text-primary mb-2">আপনার রেফারেল লিঙ্ক</div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 min-w-0 rounded-xl border border-border bg-background/40 px-4 py-3 font-mono text-sm truncate">
            {link || "—"}
          </div>
          <button
            onClick={copyLink}
            className="rounded-xl bg-gradient-brand text-primary-foreground px-4 py-3 font-bold text-sm shadow-glow inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "কপি হয়েছে" : "কপি"}
          </button>
          <button
            onClick={share}
            className="rounded-xl glass-card hover:bg-accent px-4 py-3 font-bold text-sm inline-flex items-center justify-center gap-2"
          >
            <Share2 className="h-4 w-4" /> শেয়ার
          </button>
        </div>
        <div className="mt-4 rounded-xl bg-gradient-brand/10 border border-primary/30 p-4">
          <div className="text-xs text-muted-foreground">আপনার রেফারেল কোড</div>
          <div className="font-display font-bold text-2xl tracking-widest text-primary">
            {data.referral_code || "—"}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="font-bold mb-3">কীভাবে কাজ করে?</h3>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
          <li>উপরের লিঙ্কটা বন্ধু, পরিবার বা সোশ্যাল মিডিয়ায় শেয়ার করুন।</li>
          <li>তারা লিঙ্কে ক্লিক করে সাইন আপ করবে।</li>
          <li>তাদের প্রথম অর্ডার সফল হলে দুজনেই <b className="text-primary">{data.reward_points} পয়েন্ট</b> পাবেন।</li>
          <li>পয়েন্ট আপনার ওয়ালেটে জমা হবে, পরবর্তী অর্ডারে ব্যবহার করতে পারবেন।</li>
        </ol>
      </div>

      {/* Referral list */}
      <div>
        <h3 className="font-bold mb-3">আপনার রেফারেলসমূহ</h3>
        {data.referrals.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
            এখনো কেউ আপনার লিঙ্কে সাইন আপ করেনি — শেয়ার শুরু করুন!
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="divide-y divide-glass-border">
              {data.referrals.map((r: any) => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("bn-BD")}</div>
                  </div>
                  <div className="text-right shrink-0">
                    {r.status === "completed" ? (
                      <>
                        <div className="text-xs text-emerald-500 font-bold">✓ সফল</div>
                        <div className="text-xs text-primary font-bold">+{r.points_awarded} পয়েন্ট</div>
                      </>
                    ) : r.status === "cancelled" ? (
                      <div className="text-xs text-destructive font-bold">বাতিল</div>
                    ) : (
                      <div className="text-xs text-muted-foreground">অপেক্ষমাণ</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
