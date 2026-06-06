import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { notifyNewSignupServer } from "@/lib/telegram.functions";
import { AuthShell, Field } from "@/routes/login";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "রেজিস্টার — DDS-Digital" },
      { name: "description", content: "DDS-Digital এ নতুন অ্যাকাউন্ট তৈরি করুন।" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  component: RegisterPage,
});

function RegisterPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
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

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setStep("otp");
    setOtp("");
    setResendIn(60);
    setInfo("📧 আপনার ইমেইলে ৬-সংখ্যার কোড পাঠানো হয়েছে। ইনবক্স/স্প্যাম চেক করুন।");
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp.trim(),
      type: "email",
    });

    if (verifyError) {
      setLoading(false);
      setError("কোড সঠিক নয় বা মেয়াদ শেষ। আবার চেষ্টা করুন।");
      return;
    }

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

    setLoading(false);
    setInfo("✅ ভেরিফিকেশন সফল! ড্যাশবোর্ডে নিয়ে যাচ্ছি...");
    setTimeout(() => navigate({ to: "/dashboard" }), 900);
  }

  async function resendOtp() {
    if (resendIn > 0) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setResendIn(60);
    setInfo("📧 নতুন কোড পাঠানো হয়েছে।");
  }

  return (
    <AuthShell
      title={step === "form" ? t("create_account") : "ইমেইল ভেরিফাই করুন"}
      subtitle={step === "form" ? "DDS-Digital এ যোগ দিন" : email}
    >
      {step === "form" ? (
        <form onSubmit={handleSignup} className="space-y-4">
          <Field label={t("full_name")} value={fullName} onChange={setFullName} required />
          <Field label={t("email")} type="email" value={email} onChange={setEmail} required autoComplete="email" />
          <Field label={t("password")} type="password" value={password} onChange={setPassword} required autoComplete="new-password" />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-4 py-3.5 text-base font-semibold text-white shadow-[0_10px_30px_-8px_rgba(168,85,247,0.7)] hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 border border-white/20"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("sign_up")}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          {info && <p className="text-sm text-emerald-200">{info}</p>}
          <Field
            label="৬-সংখ্যার ভেরিফিকেশন কোড"
            value={otp}
            onChange={(v) => setOtp(v.replace(/\D/g, "").slice(0, 6))}
            required
            autoComplete="one-time-code"
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 px-4 py-3.5 text-base font-semibold text-white shadow-[0_10px_30px_-8px_rgba(168,85,247,0.7)] hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2 border border-white/20"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            ভেরিফাই করুন
          </button>
          <div className="flex items-center justify-between text-xs text-white/80">
            <button type="button" onClick={() => setStep("form")} className="hover:text-white">
              ← ইমেইল বদলান
            </button>
            <button type="button" onClick={resendOtp} disabled={loading} className="hover:text-white disabled:opacity-60">
              কোড আবার পাঠান
            </button>
          </div>
        </form>
      )}
      <div className="mt-5 text-center text-xs">
        <Link to="/login" className="text-white/80 hover:text-white">
          {t("have_account")} <span className="font-semibold text-white">{t("sign_in")}</span>
        </Link>
      </div>
    </AuthShell>
  );
}
