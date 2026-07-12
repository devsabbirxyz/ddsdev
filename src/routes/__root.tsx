import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { useEffect } from "react";

import { AppProviders } from "@/components/providers/AppProviders";
import { Navbar } from "@/components/layout/Navbar";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { FloatingWhatsApp } from "@/components/layout/FloatingWhatsApp";
import { PWAInstallButton } from "@/components/layout/PWAInstallButton";
import { StickyCartBar } from "@/components/storefront/StickyCartBar";
import { CompareDrawer } from "@/components/storefront/CompareDrawer";
import { LivePurchaseNotifications } from "@/components/storefront/LivePurchaseNotifications";
import { OfflineIndicator } from "@/components/layout/OfflineIndicator";
import { ReferralCapture } from "@/components/storefront/ReferralCapture";
import { AbandonedCartTracker } from "@/lib/abandoned-cart";
import { supabase } from "@/integrations/supabase/client";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-8xl font-bold text-gradient-brand font-display">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-foreground">পেজ খুঁজে পাওয়া যায়নি</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          আপনি যে পেজটি খুঁজছেন সেটি নেই বা সরিয়ে নেওয়া হয়েছে।
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-105"
          >
            হোমে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">এই পেজটি লোড হয়নি</h1>
        <p className="mt-2 text-sm text-muted-foreground">কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করতে পারেন।</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            আবার চেষ্টা করুন
          </button>
          <a href="/" className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold">হোমে যান</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "mDKc8NrrusVb6zRqiRn5QlIEokWk-IGzTRIJSqN1T6M" },
      { name: "author", content: "Dev Sabbir Soft" },
      { name: "theme-color", content: "#0D0D1A" },
      { property: "og:site_name", content: "DDS-Digital" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/png", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = router.state.location.pathname;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/admin-login";

  // Auto-recover from stale dynamic-import chunks after a new deploy
  useEffect(() => {
    if (typeof window === "undefined") return;
    const RELOAD_KEY = "__chunk_reload_at";
    const shouldReload = (msg: string) =>
      /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg);
    const tryReload = () => {
      try {
        const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
        if (Date.now() - last < 10000) return;
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
      } catch {}
      window.location.reload();
    };
    const onErr = (e: ErrorEvent) => { if (e?.message && shouldReload(e.message)) tryReload(); };
    const onRej = (e: PromiseRejectionEvent) => {
      const msg = (e?.reason && (e.reason.message || String(e.reason))) || "";
      if (shouldReload(msg)) tryReload();
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);
    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  // Invalidate caches on auth state change (sign-in / sign-out / token refresh)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  if (isAdmin) {
    return (
      <QueryClientProvider client={queryClient}>
        <AppProviders>
          <Outlet />
          <OfflineIndicator />
        </AppProviders>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppProviders>
        <div className="flex min-h-screen flex-col bg-background">
          <AnnouncementBar />
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
          <div className="lg:hidden h-20" aria-hidden />
          <MobileBottomNav />

          <FloatingWhatsApp />
          <PWAInstallButton />
          <StickyCartBar />
          <CompareDrawer />
          <ReferralCapture />
          <AbandonedCartTracker />
          <LivePurchaseNotifications />
          <OfflineIndicator />
        </div>
      </AppProviders>
    </QueryClientProvider>
  );
}
