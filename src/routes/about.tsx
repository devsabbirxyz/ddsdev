import { createFileRoute, Link } from "@tanstack/react-router";
import { Target, Eye, Heart, Award, Users, Zap, ShieldCheck, Headphones } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "আমাদের সম্পর্কে — DDS-Digital" },
      { name: "description", content: "DDS-Digital (Dev Sabbir Soft) — বাংলাদেশের ১ নম্বর ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস এর গল্প, মিশন ও ভিশন।" },
      { property: "og:title", content: "আমাদের সম্পর্কে — DDS-Digital" },
      { property: "og:description", content: "DDS-Digital (Dev Sabbir Soft) — বাংলাদেশের ১ নম্বর ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস এর গল্প, মিশন ও ভিশন।" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const values = [
    { icon: Target, title: "আমাদের মিশন", text: "বাংলাদেশের প্রত্যেক ইউজারের হাতে সাশ্রয়ী মূল্যে অরিজিনাল ডিজিটাল প্রোডাক্ট পৌঁছে দেওয়া।" },
    { icon: Eye, title: "আমাদের ভিশন", text: "দক্ষিণ এশিয়ার নাম্বার ওয়ান ডিজিটাল প্রোডাক্ট সেলিং প্ল্যাটফর্ম হয়ে ওঠা।" },
    { icon: Heart, title: "আমাদের মূল্যবোধ", text: "সততা, স্বচ্ছতা, এবং কাস্টমার-প্রথম মানসিকতাই আমাদের পরিচয়।" },
  ];
  const stats = [
    { icon: Users, label: "Happy Customers", value: "1000+" },
    { icon: Award, label: "Products", value: "500+" },
    { icon: Zap, label: "Auto Delivery", value: "24/7" },
    { icon: ShieldCheck, label: "Secure", value: "100%" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-glow opacity-80 pointer-events-none" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center">
          <div className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium mb-4">📖 আমাদের গল্প</div>
          <h1 className="font-display font-bold text-4xl sm:text-6xl leading-tight">
            <span className="text-gradient-brand">DDS-Digital</span> সম্পর্কে
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            DDS-Digital (Dev Sabbir Soft) বাংলাদেশের একটি বিশ্বস্ত ডিজিটাল প্রোডাক্ট মার্কেটপ্লেস। আমরা সাবস্ক্রিপশন, সফটওয়্যার, অ্যাকাউন্ট, ডাউনলোডেবল প্রোডাক্ট — সবকিছু এক জায়গায় ইনস্ট্যান্ট অটো ডেলিভারির মাধ্যমে সরবরাহ করি।
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="glass-card rounded-2xl p-6 text-center">
              <s.icon className="h-6 w-6 mx-auto text-primary mb-2" />
              <div className="font-display font-bold text-3xl text-gradient-brand">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((v) => (
            <div key={v.title} className="glass-card rounded-3xl p-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-brand grid place-items-center shadow-glow mb-4">
                <v.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-xl">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">
        <div className="glass-card rounded-3xl p-8 sm:p-12">
          <h2 className="font-display font-bold text-3xl text-center">কেন <span className="text-gradient-brand">DDS-Digital</span>?</h2>
          <div className="mt-8 grid sm:grid-cols-2 gap-5">
            {[
              { icon: Zap, t: "ইনস্ট্যান্ট অটো ডেলিভারি", d: "পেমেন্ট অ্যাপ্রুভ হওয়ার সাথে সাথে আপনার মেইলে প্রোডাক্ট।" },
              { icon: ShieldCheck, t: "১০০% অরিজিনাল", d: "সব প্রোডাক্ট ভেরিফাইড সোর্স থেকে — কোনো ফেক নেই।" },
              { icon: Headphones, t: "২৪/৭ সাপোর্ট", d: "AnyDesk, TeamViewer সহ লাইভ সাপোর্ট।" },
              { icon: Award, t: "সাশ্রয়ী মূল্য", d: "বাজারের সবচেয়ে কম দামে অরিজিনাল প্রোডাক্ট।" },
            ].map((f) => (
              <div key={f.t} className="flex gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-brand grid place-items-center shadow-glow">
                  <f.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{f.t}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/shop" className="inline-block rounded-2xl bg-gradient-brand px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-105 transition">
              এখনই শপিং শুরু করুন
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
