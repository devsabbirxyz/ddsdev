import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function RecentSalesCount({ productId, hours = 24 }: { productId: string; hours?: number }) {
  const { data } = useQuery({
    queryKey: ["recent-sales", productId, hours],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("recent_sales_count", {
        p_product_id: productId,
        p_hours: hours,
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
    staleTime: 60_000,
  });

  if (!data || data < 1) return null;
  return (
    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 px-3 py-1 text-xs font-semibold text-orange-500">
      <Flame className="h-3.5 w-3.5 animate-pulse" />
      গত {hours} ঘণ্টায় <span className="font-bold">{data}</span> জন কিনেছেন
    </div>
  );
}
