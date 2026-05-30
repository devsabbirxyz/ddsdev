import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";

const couponsQuery = queryOptions({
  queryKey: ["public-coupons"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("id,code,discount_type,discount_value,minimum_order,end_date,is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/_authenticated/dashboard/coupons")({
  component: CouponsPage,
});

function CouponsPage() {
  const { data: coupons = [] } = useQuery(couponsQuery);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6">উপলব্ধ কুপন</h1>
      {coupons.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Ticket className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">এখন কোনো কুপন নেই</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="glass-card rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-brand opacity-20 blur-2xl" />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">ছাড়</div>
                  <div className="font-display font-bold text-3xl text-gradient-brand">
                    {(c.discount_type === "percentage" || c.discount_type === "percent") ? `${Number(c.discount_value)}%` : formatBDT(c.discount_value)}
                  </div>
                </div>
                <Ticket className="h-6 w-6 text-primary" />
              </div>
              <div className="mt-3 border-2 border-dashed border-border rounded-xl p-3 font-mono font-bold text-center select-all">{c.code}</div>
              <div className="mt-3 text-[11px] text-muted-foreground space-y-0.5">
                {Number(c.minimum_order ?? 0) > 0 && <div>নূন্যতম অর্ডার {formatBDT(c.minimum_order)}</div>}
                {c.end_date && <div>মেয়াদ: {new Date(c.end_date).toLocaleDateString("bn-BD")}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
