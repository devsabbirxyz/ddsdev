import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "dds_viewed_products";

export function ProductViewTracker({ productId }: { productId: string | undefined }) {
  useEffect(() => {
    if (!productId || typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      const viewed: string[] = raw ? JSON.parse(raw) : [];
      if (viewed.includes(productId)) return;
      viewed.push(productId);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(viewed.slice(-50)));
    } catch {
      // ignore
    }

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id ?? null;
        let sessionId = sessionStorage.getItem("dds_session_id");
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem("dds_session_id", sessionId);
        }
        await supabase.from("product_view_logs").insert({
          product_id: productId,
          user_id: userId,
          session_id: sessionId,
        });
      } catch {
        // ignore
      }
    })();
  }, [productId]);

  return null;
}
