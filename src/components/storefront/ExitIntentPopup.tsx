import { useEffect, useRef, useState } from "react";
import { X, Gift, Copy, Check } from "lucide-react";
import { toast } from "sonner";

const KEY = "dds_exit_intent_v1";
const COUPON = "COMEBACK10";
const DISCOUNT = "১০%";

function seenRecently() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    // Show max once per 24 hours
    return Date.now() - Number(raw) < 24 * 3600_000;
  } catch { return false; }
}

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const armedRef = useRef(false);
  const lastYRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (seenRecently()) return;

    // Arm after 8s so it doesn't fire immediately
    const arm = window.setTimeout(() => { armedRef.current = true; }, 8000);

    const trigger = () => {
      if (!armedRef.current) return;
      if (seenRecently()) return;
      armedRef.current = false;
      setOpen(true);
      try { localStorage.setItem(KEY, String(Date.now())); } catch {}
    };

    // Desktop: mouse leaves via top edge
    const onMouseOut = (e: MouseEvent) => {
      if (e.relatedTarget || (e as any).toElement) return;
      if (e.clientY <= 0) trigger();
    };

    // Mobile: fast upward scroll after inactivity, or back button intent
    const onScroll = () => {
      const y = window.scrollY;
      const delta = lastYRef.current - y;
      lastYRef.current = y;
      // fast scroll up near top
      if (delta > 40 && y < 400) trigger();
    };

    // Mobile idle-then-touch-up (30s idle then any interaction)
    const resetIdle = () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => { armedRef.current = true; }, 30_000);
    };

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", resetIdle, { passive: true });
    resetIdle();

    return () => {
      window.clearTimeout(arm);
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", resetIdle);
    };
  }, []);

  if (!open) return null;

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(COUPON);
      setCopied(true);
      toast.success("কুপন কোড কপি হয়েছে!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("কপি করা যায়নি");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] grid place-items-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Exit intent offer"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-2xl border border-primary/30 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur border border-border hover:bg-accent transition"
          aria-label="বন্ধ করুন"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header gradient */}
        <div className="relative h-32 bg-gradient-brand overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative h-full grid place-items-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white/25 backdrop-blur shadow-glow">
              <Gift className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
        </div>

        <div className="p-6 text-center space-y-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-primary">দাঁড়ান! 🎁</div>
            <h2 className="mt-1 font-display font-bold text-2xl">
              যাওয়ার আগে <span className="text-gradient-brand">{DISCOUNT} ছাড়</span> নিয়ে যান
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              আপনার পরবর্তী অর্ডারে এই কুপন ব্যবহার করে সাশ্রয় করুন। শুধু ২৪ ঘণ্টার জন্য।
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-brand/10 border-2 border-dashed border-primary/40 p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">আপনার কুপন কোড</div>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="font-display font-bold text-2xl tracking-widest text-primary">{COUPON}</span>
              <button
                onClick={copyCoupon}
                className="grid h-9 w-9 place-items-center rounded-xl glass-card hover:bg-accent transition"
                aria-label="কপি করুন"
              >
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <a
            href="/shop"
            onClick={() => setOpen(false)}
            className="block w-full rounded-2xl bg-gradient-brand text-primary-foreground py-3 font-bold shadow-glow hover:scale-[1.02] transition"
          >
            শপে যান ও সেভ করুন
          </a>

          <button
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition"
          >
            না ধন্যবাদ, আমি অফারটি চাই না
          </button>
        </div>
      </div>
    </div>
  );
}
