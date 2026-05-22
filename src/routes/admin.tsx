import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, ShoppingBag, Store, Users, Package, Wallet,
  Tag, Image as ImageIcon, Settings,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
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

const nav = [
  { to: "/admin", label: "ওভারভিউ", icon: LayoutDashboard, exact: true },
  { to: "/admin/orders", label: "অর্ডার", icon: ShoppingBag },
  { to: "/admin/sellers", label: "সেলার", icon: Store },
  { to: "/admin/affiliates", label: "অ্যাফিলিয়েট", icon: Users },
  { to: "/admin/products", label: "প্রোডাক্ট", icon: Package },
  { to: "/admin/withdrawals", label: "উইথড্র", icon: Wallet },
  { to: "/admin/categories", label: "ক্যাটাগরি", icon: Tag },
  { to: "/admin/slides", label: "স্লাইড", icon: ImageIcon },
  { to: "/admin/settings", label: "সেটিংস", icon: Settings },
];

function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <aside className="glass-card rounded-2xl p-4 h-fit lg:sticky lg:top-24">
          <div className="px-2 pb-3 mb-3 border-b border-border">
            <div className="text-xs text-muted-foreground">Admin Panel</div>
            <div className="font-display font-bold">DDS-Digital</div>
          </div>
          <nav className="space-y-1">
            {nav.map((it) => (
              <Link
                key={it.to}
                to={it.to as any}
                activeOptions={{ exact: it.exact ?? false }}
                activeProps={{ className: "bg-gradient-brand text-primary-foreground shadow-glow" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent transition"
              >
                <it.icon className="h-4 w-4" /> {it.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div><Outlet /></div>
      </div>
    </div>
  );
}
