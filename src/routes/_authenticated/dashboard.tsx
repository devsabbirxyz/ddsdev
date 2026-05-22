import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { LayoutDashboard, ShoppingBag, Download, Heart, Bell, Ticket, LifeBuoy, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "ড্যাশবোর্ড — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: DashboardLayout,
});

const items: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/dashboard", label: "ওভারভিউ", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/orders", label: "আমার অর্ডার", icon: ShoppingBag },
  { to: "/dashboard/downloads", label: "ডাউনলোড", icon: Download },
  { to: "/dashboard/wishlist", label: "উইশলিস্ট", icon: Heart },
  { to: "/dashboard/notifications", label: "নোটিফিকেশন", icon: Bell },
  { to: "/dashboard/coupons", label: "কুপন", icon: Ticket },
  { to: "/dashboard/support", label: "সাপোর্ট", icon: LifeBuoy },
  { to: "/dashboard/profile", label: "প্রোফাইল", icon: UserIcon },
];

function DashboardLayout() {
  const { user, signOut } = useAuth();
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="glass-card rounded-2xl p-4 h-fit lg:sticky lg:top-24">
          <div className="px-2 pb-3 mb-3 border-b border-border">
            <div className="text-xs text-muted-foreground">লগইন</div>
            <div className="font-semibold text-sm truncate">{user?.email}</div>
          </div>
          <nav className="space-y-1">
            {items.map((it) => (
              <Link
                key={it.to}
                to={it.to as any}
                activeOptions={{ exact: it.exact ?? false }}
                activeProps={{ className: "bg-gradient-brand text-primary-foreground shadow-glow" }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-accent transition"
              >
                <it.icon className="h-4 w-4" />
                {it.label}
              </Link>
            ))}
            <button onClick={signOut} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition">
              <LogOut className="h-4 w-4" /> লগআউট
            </button>
          </nav>
        </aside>
        <div><Outlet /></div>
      </div>
    </div>
  );
}
