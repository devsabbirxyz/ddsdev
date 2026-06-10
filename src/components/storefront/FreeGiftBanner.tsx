import { Gift, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/storefront";

const THRESHOLD = 500;

export function FreeGiftBanner() {
  const { subtotal } = useCart();
  const remaining = Math.max(0, THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / THRESHOLD) * 100);
  const unlocked = remaining === 0 && subtotal > 0;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/15 backdrop-blur-xl px-4 py-2.5 shadow-glow">
        <div className="relative flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-brand text-primary-foreground shrink-0">
            {unlocked ? <Sparkles className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
          </div>
          <p className="flex-1 min-w-0 text-xs sm:text-sm font-semibold truncate">
            {unlocked ? (
              <>🎉 অভিনন্দন! আপনি <span className="text-gradient-brand">ফ্রি গিফট</span> পেয়েছেন</>
            ) : (
              <>🎁 {formatBDT(THRESHOLD)} টাকার অফার কিনলে <span className="text-gradient-brand">গিফট</span> পাবেন</>
            )}
          </p>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-background/60 overflow-hidden">
          <div
            className="h-full bg-gradient-brand transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
