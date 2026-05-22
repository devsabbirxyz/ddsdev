import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export function LegalPage({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow mb-4">
          <FileText className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="glass-card rounded-3xl p-6 sm:p-10 space-y-6 text-sm leading-relaxed">
        {children}
      </div>
      <div className="mt-8 text-center">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← হোমে ফিরে যান</Link>
      </div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-bold text-xl mb-2">{heading}</h2>
      <div className="text-muted-foreground space-y-2">{children}</div>
    </section>
  );
}
