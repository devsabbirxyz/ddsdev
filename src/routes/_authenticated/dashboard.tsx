import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { ShoppingBag, Download, Heart, Bell, MessageSquare, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "ড্যাশবোর্ড — DDS-Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const tiles = [
    { icon: ShoppingBag, label: "My Orders", value: "0" },
    { icon: Download, label: "Downloads", value: "0" },
    { icon: Heart, label: "Wishlist", value: "0" },
    { icon: Bell, label: "Notifications", value: "0" },
    { icon: MessageSquare, label: "Support Tickets", value: "0" },
    { icon: Settings, label: "Profile", value: "—" },
  ];
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl">স্বাগতম 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div key={tile.label} className="glass-card rounded-2xl p-5 hover:shadow-glow transition">
              <div className="flex items-center justify-between mb-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-display font-bold">{tile.value}</span>
              </div>
              <div className="text-sm font-medium">{tile.label}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 rounded-2xl glass-card p-6 text-center">
        <p className="text-sm text-muted-foreground">
          🚀 কাস্টমার ড্যাশবোর্ডের সব ফিচার Phase 3 এ আসছে — Orders, Downloads, Cart, Checkout সহ।
        </p>
      </div>
    </div>
  );
}
