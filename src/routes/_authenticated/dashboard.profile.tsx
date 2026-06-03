import { createFileRoute } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { successDialog } from "@/components/ui/modal-dialogs";

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
  const [avatarUrl, setAvatarUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const [curPass, setCurPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passBusy, setPassBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("users")
      .update({ full_name: name.trim(), phone: phone.trim(), avatar_url: avatarUrl || null })
      .eq("id", user.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("প্রোফাইল আপডেট হয়েছে");
      qc.invalidateQueries({ queryKey: ["my-profile"] });
    }
  };

  const changePass = async () => {
    if (!user?.email) return;
    if (!curPass) { toast.error("বর্তমান পাসওয়ার্ড দিন"); return; }
    if (newPass.length < 6) { toast.error("নতুন পাসওয়ার্ড নূন্যতম ৬ অক্ষর হতে হবে"); return; }
    if (newPass !== confirmPass) { toast.error("নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না"); return; }
    if (newPass === curPass) { toast.error("নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ডের মতো হতে পারবে না"); return; }

    setPassBusy(true);
    // Verify current password by attempting sign-in
    const { error: verifyErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: curPass,
    });
    if (verifyErr) {
      setPassBusy(false);
      toast.error("বর্তমান পাসওয়ার্ড সঠিক নয়");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPass });
    setPassBusy(false);
    if (error) {
      toast.error(`পাসওয়ার্ড পরিবর্তনে সমস্যা: ${error.message}`);
      return;
    }
    setCurPass(""); setNewPass(""); setConfirmPass("");
    await successDialog({
      title: "Password Change Successful!",
      description: "আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।",
      buttonText: "ঠিক আছে",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl">প্রোফাইল</h1>

      <section className="glass-card rounded-2xl p-6">
        <h2 className="font-display font-bold text-lg mb-4">ব্যক্তিগত তথ্য</h2>

        <div className="flex items-center gap-4 mb-5">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-muted grid place-items-center border border-border shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <ImageUpload
              value={avatarUrl}
              onChange={setAvatarUrl}
              bucket="admin-uploads"
              label="প্রোফাইল পিকচার"
              folder={`avatars/${user?.id ?? "anon"}`}
              maxSizeMB={2}
            />
          </div>
        </div>

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
        <h2 className="font-display font-bold text-lg mb-4 inline-flex items-center gap-2">
          <Lock className="h-4 w-4" /> পাসওয়ার্ড পরিবর্তন
        </h2>
        <div className="space-y-3">
          <PassField label="বর্তমান পাসওয়ার্ড" value={curPass} onChange={setCurPass} show={showCur} setShow={setShowCur} autoComplete="current-password" />
          <PassField label="নতুন পাসওয়ার্ড" value={newPass} onChange={setNewPass} show={showNew} setShow={setShowNew} autoComplete="new-password" />
          <PassField label="কনফার্ম পাসওয়ার্ড" value={confirmPass} onChange={setConfirmPass} show={showConfirm} setShow={setShowConfirm} autoComplete="new-password" />
          <button
            onClick={changePass}
            disabled={passBusy}
            className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow disabled:opacity-60 inline-flex items-center gap-2"
          >
            <Lock className="h-4 w-4" /> {passBusy ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন"}
          </button>
        </div>
      </section>
    </div>
  );
}

function PassField({
  label, value, onChange, show, setShow, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; setShow: (v: boolean) => void; autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-xl glass px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
