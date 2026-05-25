import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAdmins, inviteAdmin, updateAdmin, removeAdmin } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Plus, Trash2, ShieldCheck, X } from "lucide-react";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({ meta: [{ title: "Admin Management" }, { name: "robots", content: "noindex" }] }),
  component: AdminsPage,
});

function AdminsPage() {
  const qc = useQueryClient();
  const list = useServerFn(listAdmins);
  const invite = useServerFn(inviteAdmin);
  const update = useServerFn(updateAdmin);
  const remove = useServerFn(removeAdmin);
  const { data, isLoading, error } = useQuery({ queryKey: ["admin", "admins"], queryFn: () => list(), retry: false });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "admin" as "admin" | "super_admin" | "moderator" });

  if (error) return <div className="glass-card rounded-2xl p-6 text-destructive">শুধু Super Admin এই পেজ দেখতে পারেন।</div>;
  if (isLoading || !data) return <div className="text-muted-foreground">লোড হচ্ছে...</div>;

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invite({ data: form });
      toast.success("Admin তৈরি হয়েছে ✅");
      setOpen(false); setForm({ email: "", password: "", full_name: "", role: "admin" });
      qc.invalidateQueries({ queryKey: ["admin", "admins"] });
    } catch (e: any) { toast.error(e.message); }
  };
  const toggle = async (role_id: string, is_active: boolean) => {
    try { await update({ data: { role_id, is_active } }); toast.success("আপডেট হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "admins"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const changeRole = async (role_id: string, role: any) => {
    try { await update({ data: { role_id, role } }); toast.success("Role আপডেট হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "admins"] }); }
    catch (e: any) { toast.error(e.message); }
  };
  const del = async (role_id: string) => {
    if (!confirm("Admin role টি ডিলিট করবেন?")) return;
    try { await remove({ data: { role_id } }); toast.success("ডিলিট হয়েছে"); qc.invalidateQueries({ queryKey: ["admin", "admins"] }); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl inline-flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-primary" /> Admin Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Admins, Super Admins, Moderators</p>
        </div>
        <button onClick={() => setOpen(true)} className="rounded-xl bg-gradient-brand px-4 py-2.5 font-bold text-primary-foreground shadow-glow text-sm inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> নতুন Admin
        </button>
      </div>

      {open && (
        <form onSubmit={onCreate} className="glass-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-bold">নতুন Admin তৈরি করুন</h2><button type="button" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="পূর্ণ নাম" className="ip" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input required type="email" placeholder="Email" className="ip" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input required type="password" minLength={8} placeholder="Password (min 8)" className="ip" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <select className="ip" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </div>
          <button className="rounded-xl bg-gradient-brand px-5 py-2.5 font-bold text-primary-foreground shadow-glow text-sm">তৈরি করুন</button>
        </form>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="text-left px-4 py-3">নাম / Email</th><th className="text-left px-4 py-3">Role</th><th className="text-left px-4 py-3">Status</th><th className="text-right px-4 py-3">Action</th></tr></thead>
          <tbody>
            {data.admins.map((a: any) => (
              <tr key={a.id} className="border-t border-border">
                <td className="px-4 py-3"><div className="font-semibold">{a.full_name || "—"}</div><div className="text-xs text-muted-foreground">{a.email}</div></td>
                <td className="px-4 py-3">
                  <select value={a.role} onChange={(e) => changeRole(a.id, e.target.value)} className="rounded-lg border border-border bg-background px-2 py-1 text-xs">
                    <option value="admin">Admin</option><option value="super_admin">Super Admin</option><option value="moderator">Moderator</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggle(a.id, !a.is_active)} className={`text-xs font-bold rounded-full px-2.5 py-0.5 ${a.is_active ? "bg-emerald-500/15 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                    {a.is_active ? "ACTIVE" : "INACTIVE"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del(a.id)} className="rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1"><Trash2 className="h-3 w-3" /> Remove</button>
                </td>
              </tr>
            ))}
            {data.admins.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">কোনো admin নেই</td></tr>}
          </tbody>
        </table>
      </div>
      <style>{`.ip{width:100%;border-radius:0.75rem;border:1px solid var(--border);background:transparent;padding:0.6rem 0.85rem;font-size:0.875rem}`}</style>
    </div>
  );
}
