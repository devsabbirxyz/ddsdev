import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function NotificationBell() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { data: count = 0 } = useQuery({
    queryKey: ["notif-unread", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count: c } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return c ?? 0;
    },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channelName = `notif-${user.id}-${Math.random().toString(36).slice(2, 8)}`;
    const ch = supabase.channel(channelName);
    ch.on(
      "postgres_changes" as any,
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
      () => {
        qc.invalidateQueries({ queryKey: ["notif-unread", user.id] });
        qc.invalidateQueries({ queryKey: ["my-notifications", user.id] });
      },
    ).subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id, qc]);

  if (!isAuthenticated) return null;

  return (
    <Link
      to="/dashboard/notifications"
      className="relative rounded-lg p-2 glass hover:bg-accent transition"
      aria-label="Notifications"
    >
      <Bell className="h-4 w-4" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-brand px-1 text-[10px] font-bold text-primary-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
