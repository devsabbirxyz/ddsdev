import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, Field } from "@/routes/login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "নতুন পাসওয়ার্ড সেট করুন — DDS-Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-detects recovery hash and creates a session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    navigate({ to: "/login" });
  }

  return (
    <AuthShell title="নতুন পাসওয়ার্ড" subtitle="আপনার নতুন পাসওয়ার্ড সেট করুন">
      {!ready ? (
        <div className="rounded-xl glass p-4 text-center text-sm text-muted-foreground">রিসেট লিংক যাচাই করা হচ্ছে...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="নতুন পাসওয়ার্ড" type="password" value={password} onChange={setPassword} required autoComplete="new-password" />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            পাসওয়ার্ড আপডেট করুন
          </button>
        </form>
      )}
    </AuthShell>
  );
}
