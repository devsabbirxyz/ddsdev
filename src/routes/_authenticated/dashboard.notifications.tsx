import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { PushPermissionButton } from "@/components/storefront/PushPermissionButton";

const notifsQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["my-notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,message,type,is_read,link,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/notifications")({
  component: NotifPage,
});

function NotifPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery(notifsQuery(user?.id));

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    qc.invalidateQueries({ queryKey: ["my-notifications"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">নোটিফিকেশন</h1>
        {items.some((i) => !i.is_read) && <button onClick={markAll} className="text-xs text-primary hover:underline inline-flex items-center gap-1"><Check className="h-3 w-3" /> সব read করুন</button>}
      </div>
      <div className="glass-card rounded-2xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div className="min-w-0">
          <div className="font-bold text-sm">🔔 Browser Push Notifications</div>
          <div className="text-xs text-muted-foreground mt-0.5">অর্ডার আপডেট, ফ্ল্যাশ সেল, রিওয়ার্ড — সব সরাসরি ব্রাউজারে পান</div>
        </div>
        <PushPermissionButton />
      </div>
      {isLoading ? (
        <div className="text-sm text-muted-foreground">লোড হচ্ছে...</div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div key={n.id} className={`rounded-2xl p-4 ${n.is_read ? "glass" : "glass-card border-l-2 border-primary"}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-sm">{n.title}</div>
                  {n.message && <div className="text-xs text-muted-foreground mt-1">{n.message}</div>}
                  <div className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at!).toLocaleString("bn-BD")}</div>
                </div>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
