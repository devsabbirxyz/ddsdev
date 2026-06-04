import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Loader2, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "লগইন — DDS-Digital" },
      { name: "description", content: "DDS-Digital এ লগইন করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: LoginPage,
});

function LoginPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
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
    navigate({ to: "/dashboard" });
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
      <div className="mt-5 flex items-center justify-between text-xs">
        <Link to="/forgot-password" className="text-white/70 hover:text-white">{t("forgot_password")}</Link>
        <Link to="/register" className="text-white font-semibold hover:underline">{t("no_account")} {t("sign_up")}</Link>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12 overflow-hidden bg-[#1a0b2e]">
      {/* Silky purple gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,#4c1d95_0%,#1a0b2e_55%),radial-gradient(ellipse_at_bottom_right,#7e22ce_0%,transparent_60%)]" />
        <div className="absolute -top-32 -left-20 h-[480px] w-[480px] rounded-full bg-purple-600/40 blur-[120px] animate-float" />
        <div className="absolute -bottom-40 -right-20 h-[520px] w-[520px] rounded-full bg-fuchsia-500/30 blur-[140px] animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/3 right-1/4 h-[320px] w-[320px] rounded-full bg-violet-400/20 blur-[100px] animate-float" style={{ animationDelay: "4s" }} />
      </div>

      {/* Glass card */}
      <div
        className="relative w-full max-w-md rounded-[2rem] p-8 sm:p-10 border border-white/25 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.25)]"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.12) 100%)",
          backdropFilter: "blur(28px) saturate(180%)",
          WebkitBackdropFilter: "blur(28px) saturate(180%)",
        }}
      >
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex flex-col items-center gap-2 mb-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center shadow-[0_10px_30px_-5px_rgba(168,85,247,0.6)]">
              <span className="text-white font-display font-bold text-2xl">D</span>
            </div>
            <span className="font-display font-bold tracking-[0.3em] text-white/90 text-sm">DDS-DIGITAL</span>
          </Link>
          <h1 className="font-display font-semibold text-3xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]">{title}</h1>
          {subtitle && <p className="text-sm text-white/70 mt-2">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  autoComplete?: string;
}) {
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;
  return (
    <label className="block">
      <span className="block text-sm font-medium text-white/85 mb-2">{label}</span>
      <div className="relative">
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          className={`w-full rounded-2xl border border-white/60 bg-white/5 px-5 py-3.5 text-sm text-white placeholder:text-white/75 outline-none focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/30 transition ${isPassword ? "pr-12" : ""}`}
          style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}
