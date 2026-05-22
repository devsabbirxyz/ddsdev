import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function ComingSoon({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="relative min-h-[60vh] grid place-items-center px-4 py-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-60 pointer-events-none" />
      <div className="relative text-center max-w-lg glass-card rounded-3xl p-10 shadow-elegant">
        <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand shadow-glow mb-4">
          <Sparkles className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-3xl mb-2">{title}</h1>
        <div className="inline-block rounded-full glass px-3 py-1 text-xs font-medium mb-4">{phase} এ আসছে</div>
        <p className="text-sm text-muted-foreground mb-6">
          এই পেজটি ডিজাইন ও ফাংশনালিটি সহ পরবর্তী phase এ যোগ হবে।
        </p>
        <Link to="/" className="inline-block rounded-xl bg-gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-105 transition">
          হোমে ফিরে যান
        </Link>
      </div>
    </div>
  );
}
