import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { subscribeBackInStock } from "@/lib/product-extras.functions";
import { useAuth } from "@/lib/auth";

export function BackInStockNotify({ productId, variantId }: { productId: string; variantId?: string | null }) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const subscribe = useServerFn(subscribeBackInStock);

  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error("সঠিক ইমেইল দিন");
      return;
    }
    setBusy(true);
    try {
      await subscribe({ data: { product_id: productId, variant_id: variantId ?? null, email } });
      setDone(true);
      toast.success("স্টকে আসলে জানিয়ে দেব!");
    } catch (e: any) {
      toast.error(e.message ?? "সাবস্ক্রাইব করা যায়নি");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl glass-card p-4 text-sm">
        ✓ ধন্যবাদ! স্টকে আসলে <span className="font-semibold">{email}</span>-এ ইমেইল পাঠাব।
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-card p-4">
      <div className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold">
        <Bell className="h-4 w-4 text-primary" /> স্টকে আসলে জানান
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="আপনার ইমেইল"
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-xl bg-gradient-brand text-primary-foreground px-4 py-2 text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
          জানান
        </button>
      </div>
    </div>
  );
}
