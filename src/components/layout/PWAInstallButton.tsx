import { useEffect, useState } from "react";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "dds_pwa_install_dismissed";

export function PWAInstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;

    const isStandalone =
      typeof window !== "undefined" &&
      (window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true);
    if (isStandalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible || !deferred) return null;

  const install = async () => {
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted" || choice.outcome === "dismissed") {
        setVisible(false);
        setDeferred(null);
        if (choice.outcome === "dismissed") {
          localStorage.setItem(DISMISS_KEY, String(Date.now()));
        }
      }
    } catch {
      setVisible(false);
    }
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-40 max-w-sm">
      <div className="glass-card rounded-2xl p-4 shadow-glow border border-primary/30 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shrink-0">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm">অ্যাপ ইনস্টল করুন</div>
          <div className="text-xs text-muted-foreground">হোম স্ক্রিনে যোগ করুন</div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={install}
            className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground"
          >
            ইনস্টল
          </button>
          <button onClick={dismiss} className="text-[10px] text-muted-foreground hover:text-foreground">
            পরে
          </button>
        </div>
      </div>
    </div>
  );
}
