import { createFileRoute, Link } from "@tanstack/react-router";
import { Code2, Mail, Github, Globe, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [
      { title: "ডেভেলপার — Dev Sabbir Soft" },
      { name: "description", content: "DDS-Digital এর ডেভেলপার Dev Sabbir Soft সম্পর্কে জানুন।" },
      { property: "og:title", content: "Developer — Dev Sabbir Soft" },
      { property: "og:url", content: "/developer" },
    ],
    links: [{ rel: "canonical", href: "/developer" }],
  }),
  component: DeveloperPage,
});

function DeveloperPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16">
      <div className="text-center">
        <div className="mx-auto h-28 w-28 rounded-3xl bg-gradient-brand grid place-items-center shadow-glow text-primary-foreground font-display font-bold text-5xl">
          DS
        </div>
        <h1 className="mt-6 font-display font-bold text-4xl">Dev Sabbir Soft</h1>
        <p className="mt-2 text-muted-foreground">Full-stack Developer · DDS-Digital এর নির্মাতা</p>
        <div className="mt-4 inline-block rounded-full glass px-4 py-1.5 text-xs font-medium">
          🇧🇩 Made in Bangladesh
        </div>
      </div>

      <div className="mt-10 glass-card rounded-3xl p-8">
        <h2 className="font-display font-bold text-2xl flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" /> পরিচিতি
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          আমি Dev Sabbir, একজন ফুল-স্ট্যাক ডেভেলপার। বাংলাদেশের ছোট ছোট ব্যবসা ও উদ্যোক্তাদের জন্য আধুনিক ডিজিটাল সমাধান বানানোই আমার লক্ষ্য। DDS-Digital হলো সেই যাত্রার প্রথম বড় প্রজেক্ট — বাংলাদেশের প্রথম পূর্ণাঙ্গ ডিজিটাল প্রোডাক্ট সেলিং সিস্টেম।
        </p>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        {[
          { icon: Mail, label: "ইমেইল", value: "contact@dds-digital.com" },
          { icon: MessageCircle, label: "WhatsApp", value: "+880 1XXXXXXXXX" },
          { icon: Globe, label: "ওয়েবসাইট", value: "dds-digital.com" },
          { icon: Github, label: "GitHub", value: "github.com/dev-sabbir" },
        ].map((c) => (
          <div key={c.label} className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
              <c.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{c.label}</div>
              <div className="text-sm font-semibold truncate">{c.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← হোমে ফিরে যান</Link>
      </div>
    </div>
  );
}
