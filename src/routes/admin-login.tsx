import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Login — DDS-Digital" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (sess.session) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", sess.session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (role) throw redirect({ to: "/admin" });
    }
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const uname = username.trim().toLowerCase();
    const email = uname.includes("@") ? uname : `${uname}@dds.local`;
    const { data, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signErr || !data.user) {
      setLoading(false);
      setError("ভুল ইউজারনেম বা পাসওয়ার্ড");
      return;
    }
    const { data: isAdmin, error: rpcErr } = await supabase.rpc("has_role", {
      _user_id: data.user.id,
      _role: "admin",
    });
    setLoading(false);
    if (rpcErr || !isAdmin) {
      await supabase.auth.signOut();
      setError("এই অ্যাকাউন্টে এডমিন অ্যাক্সেস নেই");
      return;
    }
    window.location.href = "/admin";
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] grid place-items-center px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-glow opacity-70 pointer-events-none" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[400px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="relative w-full max-w-md glass-card rounded-3xl p-8 shadow-elegant">
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow mb-3">
            <ShieldCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-2xl">Admin Login</h1>
          <p className="text-sm text-muted-foreground mt-1">শুধুমাত্র এডমিনদের জন্য</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              className="w-full rounded-xl glass border border-glass-border bg-input/40 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-muted-foreground mb-1.5">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl glass border border-glass-border bg-input/40 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-brand px-4 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
