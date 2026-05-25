import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { notify } from "@/lib/telegram-notify";
import { AuthShell, Field } from "@/routes/login";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "পাসওয়ার্ড রিসেট — DDS-Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell title={t("reset_password")} subtitle="আপনার ইমেইলে রিসেট লিংক পাঠানো হবে">
      {sent ? (
        <div className="rounded-xl glass p-4 text-center text-sm">
          📧 ইমেইল পাঠানো হয়েছে! ইনবক্স চেক করুন।
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t("email")} type="email" value={email} onChange={setEmail} required autoComplete="email" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("send_reset_link")}
          </button>
        </form>
      )}
      <div className="mt-4 text-center text-xs">
        <Link to="/login" className="text-primary hover:underline">{t("back_to_login")}</Link>
      </div>
    </AuthShell>
  );
}
