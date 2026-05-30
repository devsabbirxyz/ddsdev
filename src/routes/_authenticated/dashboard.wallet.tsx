import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Wallet, ArrowDownLeft, ArrowUpRight, Sparkles } from "lucide-react";
import { walletQuery } from "@/lib/wallet";
import { formatBDT } from "@/lib/storefront";

export const Route = createFileRoute("/_authenticated/dashboard/wallet")({
  head: () => ({ meta: [{ title: "ওয়ালেট — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { data, isLoading } = useQuery(walletQuery());
  const balance = data?.balance ?? 0;
  const txs = data?.transactions ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">ওয়ালেট</h1>

      <div className="glass-card rounded-2xl p-6 bg-gradient-brand text-primary-foreground">
        <div className="flex items-center gap-2 text-sm opacity-90"><Wallet className="h-4 w-4" /> পয়েন্ট ব্যালেন্স</div>
        <div className="font-display font-bold text-5xl mt-2">{balance.toLocaleString("bn-BD")}</div>
        <div className="text-sm opacity-90 mt-1">≈ {formatBDT(balance)} ছাড় হিসেবে ব্যবহারযোগ্য</div>
        <div className="mt-4 text-xs opacity-80 flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> প্রতিটি অর্ডারে ২% পয়েন্ট ক্যাশব্যাক পান (1 পয়েন্ট = 1৳)</div>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg mb-4">লেনদেন ইতিহাস</h2>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">লোড হচ্ছে...</div>
        ) : txs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">এখনো কোনো লেনদেন নেই — অর্ডার করুন ও পয়েন্ট আর্ন করুন!</div>
        ) : (
          <div className="space-y-2">
            {txs.map((t: any) => {
              const earn = t.points > 0;
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl glass p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`grid h-9 w-9 place-items-center rounded-lg shrink-0 ${earn ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                      {earn ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{t.description ?? t.type}</div>
                      <div className="text-[11px] text-muted-foreground">{new Date(t.created_at).toLocaleString("bn-BD")}</div>
                    </div>
                  </div>
                  <div className={`font-bold text-sm shrink-0 ${earn ? "text-primary" : "text-destructive"}`}>
                    {earn ? "+" : ""}{t.points} পয়েন্ট
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
