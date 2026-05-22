import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const downloadsQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["my-downloads", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,order_number,product_title,delivery_content,updated_at")
        .eq("user_id", userId!)
        .eq("status", "approved")
        .not("delivery_content", "is", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/downloads")({
  component: DownloadsPage,
});

function DownloadsPage() {
  const { user } = useAuth();
  const { data: items = [], isLoading } = useQuery(downloadsQuery(user?.id));

  return (
    <div>
      <h1 className="font-display font-bold text-2xl mb-6">আপনার ডাউনলোড / অ্যাক্সেস</h1>
      {isLoading ? (
        <div className="text-muted-foreground text-sm">লোড হচ্ছে...</div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Download className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">এখনো কোনো ডেলিভার করা প্রোডাক্ট নেই</p>
          <Link to="/dashboard/orders" className="mt-4 inline-block text-xs text-primary hover:underline">অর্ডার স্ট্যাটাস দেখুন</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((o) => (
            <div key={o.id} className="glass-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="font-display font-bold">{o.product_title}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{o.order_number}</div>
                </div>
              </div>
              <pre className="whitespace-pre-wrap break-words text-sm font-mono bg-background/40 rounded-xl p-4 max-h-64 overflow-auto">{o.delivery_content}</pre>
              <button onClick={() => navigator.clipboard?.writeText(o.delivery_content ?? "")} className="mt-3 rounded-lg glass px-3 py-1.5 text-xs font-semibold hover:bg-accent">কপি করুন</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
