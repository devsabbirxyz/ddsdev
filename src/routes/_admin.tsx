import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_admin")({
  beforeLoad: async ({ location }) => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } as never });
    }
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", sess.session.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Admin Panel</h1>
          <p className="text-xs text-muted-foreground">DDS-Digital control center</p>
        </div>
        <nav className="flex items-center gap-2 text-sm">
          <Link
            to="/admin/orders"
            className="rounded-xl glass-card px-4 py-2 font-semibold hover:bg-accent"
            activeProps={{ className: "rounded-xl bg-gradient-brand px-4 py-2 font-semibold text-primary-foreground shadow-glow" }}
          >
            Orders
          </Link>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
