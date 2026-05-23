import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, ShoppingBag, Store, Users, Package, Wallet,
  Tag, Image as ImageIcon, Settings, Home, CreditCard, Ticket, LifeBuoy,
  Sparkles, ShieldCheck, Mail, PanelBottom, Menu, X,
} from "lucide-react";

const adminAuthQuery = queryOptions({
  queryKey: ["admin", "auth-check"],
  staleTime: 10 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  queryFn: async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return { ok: false as const, isSuper: false };
    const uid = sess.session.user.id;
    const [a, s, m] = await Promise.all([
      supabase.rpc("has_role", { _user_id: uid, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: uid, _role: "super_admin" }),
      supabase.rpc("has_role", { _user_id: uid, _role: "moderator" }),
    ]);
    return { ok: Boolean(a.data || s.data || m.data), isSuper: Boolean(s.data) };
  },
});

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "ওভারভিউ", icon: LayoutDashboard, exact: true },
  { to: "/admin/homepage", label: "হোমপেজ CMS", icon: Home },
  { to: "/admin/footer", label: "Footer CMS", icon: PanelBottom },
  { to: "/admin/newsletter", label: "Newsletter", icon: Mail },
  { to: "/admin/orders", label: "অর্ডার", icon: ShoppingBag },
  { to: "/admin/payments", label: "পেমেন্ট মেথড", icon: CreditCard },
  { to: "/admin/tickets", label: "সাপোর্ট টিকেট", icon: LifeBuoy },
  { to: "/admin/sellers", label: "সেলার", icon: Store },
  { to: "/admin/affiliates", label: "অ্যাফিলিয়েট", icon: Users },
  { to: "/admin/customers", label: "কাস্টমার", icon: Users },
  { to: "/admin/products", label: "প্রোডাক্ট", icon: Package },
  { to: "/admin/withdrawals", label: "উইথড্র", icon: Wallet },
  { to: "/admin/categories", label: "ক্যাটাগরি", icon: Tag },
  { to: "/admin/coupons", label: "কুপন", icon: Ticket },
  { to: "/admin/slides", label: "স্লাইড", icon: ImageIcon },
  { to: "/admin/offers", label: "অফার", icon: Sparkles },
  { to: "/admin/popup", label: "Offer Popup", icon: Sparkles },
  { to: "/admin/settings", label: "সেটিংস", icon: Settings },
  { to: "/admin/admins", label: "অ্যাডমিন ম্যানেজমেন্ট", icon: ShieldCheck, superOnly: true },
] as Array<{ to: string; label: string; icon: any; exact?: boolean; superOnly?: boolean }>;


function AdminLayout() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(adminAuthQuery);

  useEffect(() => {
    if (!isLoading && data && !data.ok) {
      navigate({ to: "/admin-login" });
    }
  }, [isLoading, data, navigate]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 text-center text-muted-foreground">
        লোড হচ্ছে...
      </div>
    );
  }
  if (!data?.ok) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <aside className="glass-card rounded-2xl p-4 h-fit lg:sticky lg:top-24">
          <div className="px-2 pb-3 mb-3 border-b border-border">
            <div className="text-xs text-muted-foreground">Admin Panel</div>
            <div className="font-display font-bold">DDS-Digital</div>
          </div>
          <nav className="space-y-1">
            {nav.filter((it) => !it.superOnly || data.isSuper).map((it) => (
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
