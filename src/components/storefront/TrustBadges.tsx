// Trust & Social Proof — SSL, secure payment, replacement guarantee,
// money-back banner, and a reusable Verified Buyer badge.

import { ShieldCheck, Lock, RefreshCw, BadgeCheck, Headphones, CreditCard, Sparkles } from "lucide-react";

/* ============ TRUST BADGE SECTION ============ */
export function TrustBadgeSection() {
  const items = [
    { icon: Lock, title: "SSL সিকিউর", sub: "256-bit এনক্রিপশন", tint: "from-emerald-500 to-teal-500" },
    { icon: CreditCard, title: "সিকিউর পেমেন্ট", sub: "বিকাশ • নগদ • রকেট • উপায়", tint: "from-pink-500 to-rose-500" },
    { icon: RefreshCw, title: "৭ দিনের রিপ্লেসমেন্ট", sub: "গ্যারান্টেড ওয়ারেন্টি", tint: "from-blue-500 to-cyan-500" },
    { icon: ShieldCheck, title: "১০০% মানি-ব্যাক", sub: "কাজ না করলে ফেরত", tint: "from-amber-500 to-orange-500" },
    { icon: Headphones, title: "২৪/৭ সাপোর্ট", sub: "লাইভ চ্যাট + WhatsApp", tint: "from-violet-500 to-purple-500" },
    { icon: BadgeCheck, title: "ভেরিফায়েড সেলার", sub: "অফিসিয়াল সোর্স", tint: "from-fuchsia-500 to-indigo-500" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
      <div className="text-center mb-8 mx-auto max-w-2xl">
        <div className="text-xs text-primary font-bold uppercase tracking-wider flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5" /> ট্রাস্ট & সিকিউরিটি
        </div>
        <h2 className="mt-2 font-display font-bold text-3xl sm:text-4xl">
          কেন <span className="text-gradient-brand">DDS-Digital</span> বিশ্বস্ত?
        </h2>
        <p className="mt-3 text-sm text-muted-foreground">নিরাপদ কেনাকাটা, নিশ্চিত ডেলিভারি — আপনার প্রতিটি পয়সা সুরক্ষিত।</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div
              key={it.title}
              className="group relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl p-4 hover:shadow-glow hover:-translate-y-1 transition"
            >
              <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${it.tint} opacity-20 blur-2xl group-hover:opacity-40 transition`} />
              <div className={`relative grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${it.tint} text-white shadow-lg mb-3`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="relative">
                <div className="font-semibold text-sm">{it.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{it.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ============ MONEY-BACK GUARANTEE BANNER ============ */
export function MoneyBackBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-cyan-500/15 p-6 sm:p-8">
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-emerald-400/40 blur-2xl rounded-full" />
            <div className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl">
              <ShieldCheck className="h-12 w-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300 mb-2">
              <BadgeCheck className="h-3.5 w-3.5" /> ১০০% GUARANTEE
            </div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl leading-tight">
              মানি-ব্যাক <span className="text-gradient-brand">গ্যারান্টি</span>
            </h3>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-xl">
              প্রোডাক্ট কাজ না করলে ৭ দিনের মধ্যে <span className="font-semibold text-foreground">১০০% রিফান্ড</span> অথবা রিপ্লেসমেন্ট — কোনো প্রশ্ন ছাড়াই।
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center shrink-0">
            {[
              { v: "৭ দিন", l: "ওয়ারেন্টি" },
              { v: "১০০%", l: "রিফান্ড" },
              { v: "২৪/৭", l: "সাপোর্ট" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 px-3 py-2">
                <div className="font-display font-bold text-lg text-gradient-brand">{s.v}</div>
                <div className="text-[10px] text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ VERIFIED BUYER BADGE ============ */
export function VerifiedBuyerBadge({ size = "sm" }: { size?: "xs" | "sm" | "md" }) {
  const sizes = {
    xs: "text-[9px] px-1.5 py-0.5 gap-0.5",
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1",
  };
  const iconSize = size === "md" ? "h-3.5 w-3.5" : size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 text-emerald-300 ${sizes[size]}`}
      title="Verified Buyer — এই কাস্টমার প্রোডাক্টটি কিনেছেন"
    >
      <BadgeCheck className={iconSize} />
      Verified Buyer
    </span>
  );
}
