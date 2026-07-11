import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { enablePush, disablePush, isSubscribed, getPermission, isPushSupported } from "@/lib/push-client";
import { useAuth } from "@/lib/auth";

type State = "idle" | "loading" | "on" | "off" | "denied" | "unsupported";

export function PushPermissionButton({ compact = false }: { compact?: boolean }) {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isPushSupported()) { setState("unsupported"); return; }
    const perm = getPermission();
    if (perm === "denied") { setState("denied"); return; }
    void isSubscribed().then((s) => setState(s ? "on" : "off"));
  }, [isAuthenticated]);

  if (!isAuthenticated || state === "unsupported" || state === "idle") return null;

  const toggle = async () => {
    setState("loading");
    if (state === "on") {
      await disablePush();
      toast.success("নোটিফিকেশন বন্ধ হয়েছে");
      setState("off");
    } else {
      const res = await enablePush();
      if (res.ok) {
        toast.success("নোটিফিকেশন চালু হয়েছে ✅ আপনি এখন অর্ডার আপডেট, অফার সব পাবেন");
        setState("on");
      } else if (res.reason === "denied") {
        toast.error("Permission denied — browser settings থেকে চালু করুন");
        setState("denied");
      } else {
        toast.error("চালু করা যায়নি");
        setState("off");
      }
    }
  };

  if (state === "denied") {
    return (
      <div className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground glass-card rounded-xl p-3"}>
        🔕 নোটিফিকেশন ব্লক করা আছে। Browser address bar → lock icon → Notifications → Allow
      </div>
    );
  }

  const on = state === "on";
  return (
    <button
      onClick={toggle}
      disabled={state === "loading"}
      className={
        compact
          ? `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${on ? "bg-emerald-500/15 text-emerald-500" : "bg-gradient-brand text-primary-foreground shadow-glow"}`
          : `inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${on ? "glass-card hover:bg-accent" : "bg-gradient-brand text-primary-foreground shadow-glow hover:scale-[1.02]"}`
      }
    >
      {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : on ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {on ? "নোটিফিকেশন বন্ধ" : "নোটিফিকেশন চালু করুন"}
    </button>
  );
}
