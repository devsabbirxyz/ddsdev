import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

/**
 * Small top banner that appears when the browser goes offline.
 * Reassures users that their cart is saved locally and will sync when back online.
 */
export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [justCameBack, setJustCameBack] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const goOnline = () => {
      setOnline(true);
      setJustCameBack(true);
      window.setTimeout(() => setJustCameBack(false), 2500);
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online && !justCameBack) return null;

  return (
    <div
      role="status"
      className={`fixed inset-x-0 top-0 z-[100] text-center text-xs font-semibold py-2 px-3 shadow-lg ${
        online
          ? "bg-emerald-500 text-white"
          : "bg-amber-500 text-black"
      }`}
    >
      {online ? (
        <span className="inline-flex items-center gap-2">
          <Wifi className="h-3.5 w-3.5" /> ইন্টারনেট ফিরে এসেছে — সব sync হচ্ছে
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <WifiOff className="h-3.5 w-3.5" /> আপনি অফলাইন — কার্ট নিরাপদে সেভ আছে, ইন্টারনেট এলে অর্ডার করতে পারবেন
        </span>
      )}
    </div>
  );
}
