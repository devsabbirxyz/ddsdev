import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

// Debounce delay before syncing an abandoned cart snapshot.
// 15 minutes of no cart change (and no checkout) = considered abandoned.
const ABANDON_DELAY_MS = 15 * 60 * 1000;

export function useAbandonedCartSync() {
  const { items, subtotal, count } = useCart();
  const { user, isAuthenticated } = useAuth();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    // Clear cart → delete abandoned row
    if (count === 0) {
      void (supabase as any).from("abandoned_carts").delete().eq("user_id", user.id);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    // Debounce: only mark abandoned after 15 min of inactivity
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      try {
        await (supabase as any)
          .from("abandoned_carts")
          .upsert({
            user_id: user.id,
            cart_snapshot: items,
            item_count: count,
            subtotal,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id" });
      } catch {
        // ignore — best effort
      }
    }, ABANDON_DELAY_MS);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [items, subtotal, count, isAuthenticated, user?.id]);
}

export function AbandonedCartTracker() {
  useAbandonedCartSync();
  return null;
}
