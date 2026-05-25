import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { notify } from "@/lib/telegram-notify";
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
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    notify.newSignup({ email, name: fullName });
    setSuccess(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 1500);
  }

  return (
    <AuthShell title={t("create_account")} subtitle="DDS-Digital এ যোগ দিন">
      {success ? (
        <div className="rounded-xl glass p-4 text-center text-sm">
          ✅ অ্যাকাউন্ট তৈরি হয়েছে! আপনাকে ড্যাশবোর্ডে নিয়ে যাচ্ছি...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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
      )}
      <div className="mt-5 text-center text-xs">
        <Link to="/login" className="text-white/80 hover:text-white">
          {t("have_account")} <span className="font-semibold text-white">{t("sign_in")}</span>
        </Link>
      </div>
    </AuthShell>
  );
}
