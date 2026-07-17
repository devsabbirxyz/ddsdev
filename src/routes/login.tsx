import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Loader2 } from "lucide-react";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";

function safeNext(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "লগইন — DDS-Digital" },
      { name: "description", content: "DDS-Digital এ লগইন করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ href: safeNext(search.next) } as never);
  },
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = safeNext(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (dest !== "/dashboard") {
      window.location.href = dest;
    } else {
      navigate({ to: "/dashboard" });
    }
  }

  return (
    <AuthShell title={t("welcome_back")} subtitle="আপনার অ্যাকাউন্টে লগইন করুন">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("email")} type="email" value={email} onChange={setEmail} required autoComplete="email" />
        <Field label={t("password")} type="password" value={password} onChange={setPassword} required autoComplete="current-password" />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-4 py-3.5 text-base font-semibold text-white shadow-[0_10px_30px_-8px_rgba(168,85,247,0.7)] hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 border border-white/20"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("sign_in")}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-white/50">
        <div className="h-px flex-1 bg-white/15" />
        <span>অথবা</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>
      <GoogleButton next={dest} />
      <div className="mt-5 flex items-center justify-between text-xs">
        <Link to="/forgot-password" className="text-white/70 hover:text-white">{t("forgot_password")}</Link>
        <Link
          to="/register"
          search={next ? { next } : undefined as never}
          className="text-white font-semibold hover:underline"
        >
          {t("no_account")} {t("sign_up")}
        </Link>
      </div>
    </AuthShell>
  );
}
