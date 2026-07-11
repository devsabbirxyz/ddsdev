import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, ShoppingBag, Download, Heart, Bell, Ticket, LifeBuoy, User as UserIcon, LogOut, Wallet, CalendarClock, Menu, X, Share2 } from "lucide-react";
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
  { to: "/dashboard/wallet", label: "ওয়ালেট", icon: Wallet },
  { to: "/dashboard/subscriptions", label: "সাবস্ক্রিপশন", icon: CalendarClock },
  { to: "/dashboard/coupons", label: "কুপন", icon: Ticket },
  { to: "/dashboard/referrals", label: "রেফার ও আয়", icon: Share2 },
  { to: "/dashboard/support", label: "সাপোর্ট", icon: LifeBuoy },
  { to: "/dashboard/profile", label: "প্রোফাইল", icon: UserIcon },
];

function DashboardLayout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="rounded-xl p-2 hover:bg-accent transition border border-border inline-flex items-center gap-2"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
          <span className="text-sm font-medium">মেনু</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] h-full overflow-y-auto bg-card border-r border-border p-4 shadow-2xl animate-in slide-in-from-left">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">লগইন</div>
                <div className="font-semibold text-sm truncate">{user?.email}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-accent"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
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
        </div>
      )}

      <div><Outlet /></div>
    </div>
  );
}
