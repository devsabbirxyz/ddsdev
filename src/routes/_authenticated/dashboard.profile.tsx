import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const profileQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["my-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("id,email,full_name,phone,avatar_url").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: profile } = useQuery(profileQuery(user?.id));
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [passBusy, setPassBusy] = useState(false);

  useEffect(() => {
    if (profile) { setName(profile.full_name ?? ""); setPhone(profile.phone ?? ""); }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("users").update({ full_name: name.trim(), phone: phone.trim() }).eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("প্রোফাইল আপডেট হয়েছে"); qc.invalidateQueries({ queryKey: ["my-profile"] }); }
  };

  const changePass = async () => {
    if (newPass.length < 6) { toast.error("পাসওয়ার্ড নূন্যতম ৬ অক্ষর"); return; }
    setPassBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("পাসওয়ার্ড পরিবর্তন হয়েছে"); setNewPass(""); }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">প্রোফাইল</h1>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg mb-4">ব্যক্তিগত তথ্য</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold mb-1.5 block">ইমেইল</label>
            <input value={user?.email ?? ""} disabled className="w-full rounded-xl glass px-3 py-2 text-sm opacity-70" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">পূর্ণ নাম</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl glass px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">ফোন নম্বর</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-xl glass px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <button onClick={save} disabled={busy} className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow inline-flex items-center gap-2 disabled:opacity-60">
            <Save className="h-4 w-4" /> {busy ? "সেভ হচ্ছে..." : "সেভ করুন"}
          </button>
        </div>
      </section>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg mb-4 inline-flex items-center gap-2"><Lock className="h-4 w-4" /> পাসওয়ার্ড পরিবর্তন</h2>
        <div className="flex flex-wrap gap-2">
          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="নতুন পাসওয়ার্ড" className="flex-1 min-w-[200px] rounded-xl glass px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          <button onClick={changePass} disabled={passBusy} className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60">
            {passBusy ? "..." : "পরিবর্তন"}
          </button>
        </div>
      </section>
    </div>
  );
}
