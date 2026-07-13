import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAdminAuthState } from "@/lib/admin.functions";
import {
  LayoutDashboard, ShoppingBag, Store, Users, Package, Wallet,
  Tag, Image as ImageIcon, Settings, Home, CreditCard, Ticket, LifeBuoy,
  Sparkles, ShieldCheck, Mail, PanelBottom, Menu, X, Search, Bell, MessageSquare, LogOut, Rocket, MessageCircle, CalendarClock, BarChart3, FileSpreadsheet,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: any; exact?: boolean; superOnly?: boolean };
type NavGroup = { heading: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    heading: "General",
    items: [
      { to: "/admin", label: "ওভারভিউ", icon: LayoutDashboard, exact: true },
      { to: "/admin/analytics", label: "অ্যানালিটিক্স", icon: BarChart3 },
      { to: "/admin/intelligence", label: "Intelligence ✨", icon: Sparkles },
      { to: "/admin/reports", label: "রিপোর্ট", icon: FileSpreadsheet },
      { to: "/admin/orders", label: "অর্ডার", icon: ShoppingBag },
      { to: "/admin/products", label: "প্রোডাক্ট", icon: Package },
      { to: "/admin/customers", label: "কাস্টমার", icon: Users },
      { to: "/admin/tickets", label: "সাপোর্ট টিকেট", icon: LifeBuoy },
    ],
  },
  {
    heading: "Commerce",
    items: [
      { to: "/admin/sellers", label: "সেলার", icon: Store },
      { to: "/admin/affiliates", label: "অ্যাফিলিয়েট", icon: Users },
      { to: "/admin/withdrawals", label: "উইথড্র", icon: Wallet },
      { to: "/admin/payments", label: "পেমেন্ট মেথড", icon: CreditCard },
      { to: "/admin/categories", label: "ক্যাটাগরি", icon: Tag },
      { to: "/admin/coupons", label: "কুপন", icon: Ticket },
      { to: "/admin/subscriptions", label: "সাবস্ক্রিপশন প্ল্যান", icon: CalendarClock },
      { to: "/admin/bundles", label: "বান্ডল অফার", icon: Package },
    ],
  },
  {
    heading: "CMS",
    items: [
      { to: "/admin/homepage", label: "হোমপেজ", icon: Home },
      { to: "/admin/footer", label: "Footer", icon: PanelBottom },
      { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
      { to: "/admin/slides", label: "স্লাইড", icon: ImageIcon },
      { to: "/admin/offers", label: "অফার", icon: Sparkles },
      { to: "/admin/popup", label: "Offer Popup", icon: Sparkles },
      { to: "/admin/banner-timer", label: "Countdown Banner", icon: Sparkles },
    ],
  },
  {
    heading: "Settings",
    items: [
      { to: "/admin/settings", label: "সেটিংস", icon: Settings },
      { to: "/admin/telegram", label: "টেলিগ্রাম নোটিফিকেশন", icon: MessageCircle },
      { to: "/admin/push", label: "পুশ নোটিফিকেশন", icon: Bell },
      { to: "/admin/admins", label: "অ্যাডমিন ম্যানেজমেন্ট", icon: ShieldCheck, superOnly: true },
    ],
  },
];


function AdminLayout() {
  const navigate = useNavigate();
  const getAuthState = useServerFn(getAdminAuthState);
  const currentUser = useQuery({
    queryKey: ["admin", "current-user"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      return {
        userId: userErr || !userData.user ? "" : userData.user.id,
      };
    },
  });
  const userId = currentUser.data?.userId ?? "";
  const adminAuth = useQuery({
    queryKey: ["admin", "auth-check", userId],
    enabled: Boolean(userId) && !currentUser.isFetching,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    queryFn: async () => getAuthState(),
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const data = userId ? adminAuth.data : { ok: false, isSuper: false, email: "" };
  const isLoading = currentUser.isLoading || currentUser.isFetching || (Boolean(userId) && (adminAuth.isLoading || adminAuth.isFetching));

  useEffect(() => {
    if (!isLoading && data && !data.ok) {
      navigate({ to: "/admin-login" });
    }
  }, [isLoading, data, navigate]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center text-muted-foreground">
        লোড হচ্ছে...
      </div>
    );
  }
  if (!data?.ok) return null;

  const filteredGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((it) => !it.superOnly || data.isSuper) }))
    .filter((g) => g.items.length);

  const initial = (data.email || "A").trim().charAt(0).toUpperCase();
  const displayName = data.email?.split("@")[0] || "Admin";

  const SidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="px-2 pb-5 mb-2 flex items-center justify-between">
        <Link to="/admin" className="inline-flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display font-bold text-lg tracking-tight">DDS<span className="text-primary">Admin</span></span>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden rounded-lg p-1.5 hover:bg-white/5"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Grouped nav */}
      <nav className="flex-1 overflow-y-auto pr-1 space-y-5 [scrollbar-width:thin]">
        {filteredGroups.map((g) => (
          <div key={g.heading}>
            <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
              {g.heading}
            </div>
            <div className="space-y-1">
              {g.items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to as any}
                  activeOptions={{ exact: it.exact ?? false }}
                  activeProps={{
                    className: "bg-gradient-to-r from-secondary to-secondary/70 text-secondary-foreground shadow-glow-purple",
                  }}
                  inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-white/5" }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition group"
                >
                  <it.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{it.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Promo card */}
      <div className="mt-4 rounded-2xl p-4 bg-gradient-to-br from-primary/15 via-secondary/15 to-transparent border border-white/10 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-brand blur-2xl opacity-50" />
        <Rocket className="h-5 w-5 text-primary mb-2" />
        <div className="text-sm font-bold">স্টোরফ্রন্ট দেখুন</div>
        <div className="text-[11px] text-muted-foreground mt-0.5 mb-3">লাইভ সাইটে আপনার পরিবর্তন প্রিভিউ করুন।</div>
        <Link to="/" className="inline-flex items-center justify-center w-full rounded-xl bg-gradient-brand text-primary-foreground text-xs font-bold py-2 shadow-glow hover:scale-[1.02] transition">
          ওপেন স্টোর
        </Link>
      </div>

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/admin-login" });
        }}
        className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition"
      >
        <LogOut className="h-4 w-4" /> লগ আউট
      </button>
    </div>
  );

  return (
    <div className="admin-theme min-h-screen bg-background lg:flex">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60" style={{ background: "var(--gradient-glow)" }} />

      {/* Persistent desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 h-screen sticky top-0 bg-card border-r border-white/10 p-4">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 max-w-[85vw] h-full overflow-hidden bg-card border-r border-white/10 p-4 shadow-2xl animate-in slide-in-from-left">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-white/5">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden rounded-xl p-2 hover:bg-white/5 transition border border-white/10"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="hidden sm:flex items-center gap-3 min-w-0">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-brand text-primary-foreground font-bold shadow-glow shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-sm truncate">
                  Welcome, <span className="text-primary">{displayName}</span> 👋
                </div>
                <div className="text-[11px] text-muted-foreground">Security is a process, not a product.</div>
              </div>
            </div>

            <div className="flex-1 max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search Here"
                  className="w-full rounded-full bg-white/5 border border-white/10 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/admin/products/new"
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-primary-foreground bg-gradient-brand shadow-glow hover:scale-[1.02] transition"
              >
                <span className="text-base leading-none">+</span> New Product
              </Link>
              <Link
                to="/admin/coupons"
                className="hidden md:inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border border-white/15 hover:bg-white/5 transition"
              >
                New Coupon
              </Link>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10" aria-label="Messages">
                <MessageSquare className="h-4 w-4" />
              </button>
              <button className="grid h-10 w-10 place-items-center rounded-full bg-white/5 hover:bg-white/10 transition border border-white/10" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 py-6 lg:py-8 max-w-[1400px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}


