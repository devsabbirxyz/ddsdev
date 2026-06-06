import { Gift, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/storefront";

const THRESHOLD = 500;
const GIFT_NAME = "এক্সক্লুসিভ গিফট কুপন";

export function FreeGiftBanner() {
  const { subtotal } = useCart();
  const remaining = Math.max(0, THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / THRESHOLD) * 100);
  const unlocked = remaining === 0 && subtotal > 0;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/15 backdrop-blur-xl p-5 sm:p-6 shadow-glow">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-secondary/30 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative shrink-0">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow animate-pulse">
              <Gift className="h-7 w-7" />
            </div>
            {unlocked && (
              <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-yellow-400 animate-pulse" />
            )}
          </div>

          <div className="flex-1 min-w-0 w-full">
            {unlocked ? (
              <>
                <div className="font-display font-bold text-lg sm:text-xl">
                  🎉 অভিনন্দন! আপনি <span className="text-gradient-brand">ফ্রি গিফট</span> পেয়েছেন
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  চেকআউটে {GIFT_NAME} অটোমেটিক্যালি যোগ হয়ে যাবে।
                </p>
              </>
            ) : (
              <>
                <div className="font-display font-bold text-lg sm:text-xl">
                  🎁 {formatBDT(THRESHOLD)}+ অর্ডারে <span className="text-gradient-brand">ফ্রি গিফট!</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {subtotal > 0
                    ? <>আর মাত্র <span className="font-bold text-primary">{formatBDT(remaining)}</span> বাকি — {GIFT_NAME} আনলক করতে।</>
                    : <>কার্টে {formatBDT(THRESHOLD)} বা তার বেশি প্রোডাক্ট যোগ করুন, ফ্রি গিফট পেয়ে যান।</>}
                </p>
              </>
            )}

            <div className="mt-3 h-2 w-full rounded-full bg-background/60 overflow-hidden">
              <div
                className="h-full bg-gradient-brand transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Link
            to="/shop"
            className="shrink-0 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-105 transition whitespace-nowrap"
          >
            {unlocked ? "চেকআউট →" : "শপ এখনই"}
          </Link>
        </div>
      </div>
    </section>
  );
}
