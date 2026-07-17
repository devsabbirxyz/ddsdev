import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { notifyNewSignupServer } from "@/lib/telegram.functions";
import { attachReferrer } from "@/lib/referral.functions";
import { getPendingReferralCode, clearPendingReferralCode } from "@/components/storefront/ReferralCapture";
import { AuthShell, Field } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "রেজিস্টার — DDS-Digital" },
      { name: "description", content: "DDS-Digital এ নতুন অ্যাকাউন্ট তৈরি করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const n = search.next;
      throw redirect({ href: n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard" } as never);
    }
  },
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }
    if (password !== confirmPassword) {
      setError("পাসওয়ার্ড দুটি মিলছে না। আবার চেষ্টা করুন।");
      return;
    }

    setLoading(true);

    // Ensure no previous (e.g. admin) session leaks into the new account flow
    await supabase.auth.signOut();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // Auto sign-in (in case session isn't returned by signUp)
    await supabase.auth.signInWithPassword({ email, password });

    // Fire Telegram notification (best-effort)
    try {
      await notifyNewSignupServer({
        data: {
          email,
          name: fullName,
          origin: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
    } catch {
      // ignore
    }

    // Link referral if user came from a ?ref= link (best-effort)
    try {
      const code = getPendingReferralCode();
      if (code) {
        await attachReferrer({ data: { code } });
        clearPendingReferralCode();
      }
    } catch {
      // ignore
    }

    setLoading(false);
    setInfo("✅ অ্যাকাউন্ট তৈরি সফল! নিয়ে যাচ্ছি...");
    setTimeout(() => {
      if (dest !== "/dashboard") window.location.href = dest;
      else navigate({ to: "/dashboard" });
    }, 700);
  }

  return (
    <AuthShell title={t("create_account")} subtitle="DDS-Digital এ যোগ দিন">
      <form onSubmit={handleSignup} className="space-y-4">
        <Field label={t("full_name")} value={fullName} onChange={setFullName} required />
        <Field label={t("email")} type="email" value={email} onChange={setEmail} required autoComplete="email" />
        <Field label={t("password")} type="password" value={password} onChange={setPassword} required autoComplete="new-password" />
        <Field label="কনফার্ম পাসওয়ার্ড" type="password" value={confirmPassword} onChange={setConfirmPassword} required autoComplete="new-password" />
        {error && <p className="text-sm text-red-300">{error}</p>}
        {info && <p className="text-sm text-emerald-200">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-4 py-3.5 text-base font-semibold text-white shadow-[0_10px_30px_-8px_rgba(168,85,247,0.7)] hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 border border-white/20"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("sign_up")}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-white/50">
        <div className="h-px flex-1 bg-white/15" />
        <span>অথবা</span>
        <div className="h-px flex-1 bg-white/15" />
      </div>
      <GoogleButton label="Google দিয়ে সাইনআপ করুন" next={dest} />
      <div className="mt-5 text-center text-xs">
        <Link
          to="/login"
          search={next ? { next } : undefined as never}
          className="text-white/80 hover:text-white"
        >
          {t("have_account")} <span className="font-semibold text-white">{t("sign_in")}</span>
        </Link>
      </div>
    </AuthShell>
  );
}
