import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { Zap, Shield, Headphones, Trophy, Users, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DDS-Digital — Bangladesh Number 1 Digital Product Selling System" },
      { name: "description", content: "DDS-Digital (Dev Sabbir Soft) — বাংলাদেশের ১ নম্বর ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস। সাবস্ক্রিপশন, সফটওয়্যার, অ্যাকাউন্ট সবকিছু এক জায়গায়।" },
      { property: "og:title", content: "DDS-Digital — Bangladesh Number 1 Digital Product Selling System" },
      { property: "og:description", content: "বাংলাদেশের ১ নম্বর ডিজিটাল প্রোডাক্ট সেলিং প্ল্যাটফর্ম। ইনস্ট্যান্ট ডেলিভারি, সিকিউর পেমেন্ট, ২৪/৭ সাপোর্ট।" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "DDS-Digital",
          alternateName: "Dev Sabbir Soft",
          description: "Bangladesh's Number 1 Digital Product Selling System",
          areaServed: "BD",
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useI18n();

  const trustItems = [
    { icon: Trophy, label: "Best Quality", sub: "100% Authentic" },
    { icon: Lock, label: "Secure Payments", sub: "Bkash • Nagad • Rocket" },
    { icon: Headphones, label: "24/7 Support", sub: "Anydesk / Teamviewer" },
    { icon: Zap, label: "Instant Delivery", sub: "অটো ডেলিভারি" },
    { icon: Users, label: "1000+ Customers", sub: "Happy & Trusted" },
    { icon: Shield, label: "Safe & Private", sub: "Privacy Protected" },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 bg-gradient-glow opacity-90 pointer-events-none" />
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px] pointer-events-none" />
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-secondary/30 blur-[120px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-20 pb-32 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {t("hero_badge")}
          </div>

          {/* Heading */}
          <h1 className="mt-6 font-display font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
            <span className="block">{t("site_name")}</span>
            <span className="block mt-2 text-gradient-brand">{t("tagline_full")}</span>
          </h1>

          {/* Sub */}
          <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t("tagline")} — সাবস্ক্রিপশন, সফটওয়্যার, অ্যাকাউন্ট, ডাউনলোডেবল প্রোডাক্ট সবকিছু এক জায়গায়। ইনস্ট্যান্ট অটো ডেলিভারি।
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/shop"
              className="rounded-2xl bg-gradient-brand px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-105 transition"
            >
              {t("shop_now")}
            </Link>
            <Link
              to="/about"
              className="rounded-2xl glass-card px-7 py-3.5 text-sm font-semibold hover:bg-accent transition"
            >
              আরও জানুন
            </Link>
          </div>

          {/* Floating preview card */}
          <div className="mt-16 mx-auto max-w-3xl glass-card rounded-3xl p-6 sm:p-8 shadow-elegant animate-float">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl sm:text-4xl font-display font-bold text-gradient-brand">1K+</div>
                <div className="text-xs text-muted-foreground mt-1">Happy Customers</div>
              </div>
              <div className="border-x border-border">
                <div className="text-3xl sm:text-4xl font-display font-bold text-gradient-brand">500+</div>
                <div className="text-xs text-muted-foreground mt-1">Digital Products</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-display font-bold text-gradient-brand">24/7</div>
                <div className="text-xs text-muted-foreground mt-1">Live Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-glass-border bg-surface py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 rounded-xl glass p-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-brand text-primary-foreground shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{item.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{item.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-20 text-center">
        <div className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium mb-6">
          🚀 Phase 1 Complete — সাইট তৈরি হচ্ছে
        </div>
        <h2 className="font-display font-bold text-3xl sm:text-4xl">
          আরও <span className="text-gradient-brand">দারুণ ফিচার</span> আসছে
        </h2>
        <p className="mt-3 mx-auto max-w-xl text-muted-foreground">
          Shop, Single Product, Cart, Checkout, Dashboard, Admin Panel — সব Phase 2-7 এ যোগ হবে।
        </p>
      </section>
    </>
  );
}
