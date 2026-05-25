import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { savePaymentMethod, deletePaymentMethod, listPaymentMethodsAdmin } from "@/lib/admin.functions";

const pmQuery = queryOptions({
  queryKey: ["admin", "payment-methods"],
  queryFn: async () => await listPaymentMethodsAdmin(),
});

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payment Methods — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminPayments,
});

type PM = {
  id?: string | null;
  name: string;
  name_en?: string | null;
  account_type?: string | null;
  send_type?: string | null;
  account_number?: string | null;
  instructions?: string | null;
  instructions_en?: string | null;
  api_key?: string | null;
  has_automatic?: boolean;
  is_manual_active?: boolean;
  is_automatic_active?: boolean;
  sort_order?: number;
};

const empty: PM = {
  name: "",
  name_en: "",
  account_type: "personal",
  send_type: "send_money",
  account_number: "",
  instructions: "",
  api_key: "",
  has_automatic: false,
  is_manual_active: true,
  is_automatic_active: false,
  sort_order: 0,
};

function AdminPayments() {
  const qc = useQueryClient();
  const { data: methods = [], isLoading } = useQuery(pmQuery);
  const save = useServerFn(savePaymentMethod);
  const del = useServerFn(deletePaymentMethod);
  const [editing, setEditing] = useState<PM | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error("নাম দিন"); return; }
    setBusy(true);
    try {
      await save({ data: editing as any });
      await qc.invalidateQueries({ queryKey: ["admin", "payment-methods"] });
      toast.success("সেভ হয়েছে");
      setEditing(null);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    try {
      await del({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["admin", "payment-methods"] });
      toast.success("ডিলিট হয়েছে");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl">পেমেন্ট মেথড</h1>
          <p className="text-sm text-muted-foreground">bKash / Nagad / Rocket ইত্যাদি ম্যানেজ করুন</p>
        </div>
        <button
          onClick={() => setEditing({ ...empty })}
          className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> নতুন
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && <p className="text-muted-foreground">লোড হচ্ছে...</p>}
        {methods.map((m) => (
          <div key={m.id} className="glass-card rounded-2xl p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display font-bold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.account_type} · {m.send_type}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setEditing(m as any)} className="text-xs rounded-lg glass px-2.5 py-1 hover:bg-accent">Edit</button>
                <button onClick={() => onDelete(m.id)} className="text-xs rounded-lg border border-destructive/40 text-destructive px-2.5 py-1 hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="text-sm font-mono">{m.account_number ?? "—"}</div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className={`rounded-full border px-2 py-0.5 ${m.is_manual_active ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "glass"}`}>Manual {m.is_manual_active ? "ON" : "OFF"}</span>
              {m.has_automatic && (
                <span className={`rounded-full border px-2 py-0.5 ${m.is_automatic_active ? "bg-sky-500/15 text-sky-300 border-sky-500/30" : "glass"}`}>Auto {m.is_automatic_active ? "ON" : "OFF"}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl p-6 w-full max-w-xl space-y-4 my-8">
            <h3 className="font-display font-bold text-lg">{editing.id ? "Edit" : "নতুন"} পেমেন্ট মেথড</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="নাম *"><input className="inp" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Name (EN)"><input className="inp" value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></Field>
              <Field label="Account Type">
                <select className="inp" value={editing.account_type ?? ""} onChange={(e) => setEditing({ ...editing, account_type: e.target.value })}>
                  <option value="personal">Personal</option>
                  <option value="agent">Agent</option>
                  <option value="merchant">Merchant</option>
                </select>
              </Field>
              <Field label="Send Type">
                <select className="inp" value={editing.send_type ?? ""} onChange={(e) => setEditing({ ...editing, send_type: e.target.value })}>
                  <option value="send_money">Send Money</option>
                  <option value="cash_in">Cash In</option>
                  <option value="payment">Payment</option>
                </select>
              </Field>
              <Field label="Account Number"><input className="inp" value={editing.account_number ?? ""} onChange={(e) => setEditing({ ...editing, account_number: e.target.value })} /></Field>
              <Field label="Sort Order"><input type="number" className="inp" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Instructions (BN)">
              <textarea rows={3} className="inp" value={editing.instructions ?? ""} onChange={(e) => setEditing({ ...editing, instructions: e.target.value })} />
            </Field>
            <Field label="Instructions (EN)">
              <textarea rows={2} className="inp" value={editing.instructions_en ?? ""} onChange={(e) => setEditing({ ...editing, instructions_en: e.target.value })} />
            </Field>

            <div className="border-t border-border pt-3 space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.is_manual_active} onChange={(e) => setEditing({ ...editing, is_manual_active: e.target.checked })} />
                Manual পেমেন্ট অ্যাক্টিভ
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.has_automatic} onChange={(e) => setEditing({ ...editing, has_automatic: e.target.checked })} />
                Automatic পেমেন্ট সাপোর্টেড
              </label>
              {editing.has_automatic && (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={!!editing.is_automatic_active} onChange={(e) => setEditing({ ...editing, is_automatic_active: e.target.checked })} />
                    Automatic পেমেন্ট অ্যাক্টিভ
                  </label>
                  <Field label="API Key / Credentials">
                    <input className="inp" value={editing.api_key ?? ""} onChange={(e) => setEditing({ ...editing, api_key: e.target.value })} placeholder="Merchant API key" />
                  </Field>
                </>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <button onClick={() => setEditing(null)} className="rounded-xl glass px-4 py-2 text-sm hover:bg-accent">বাতিল</button>
              <button onClick={onSave} disabled={busy} className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow inline-flex items-center gap-2 disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সেভ
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.inp{width:100%;border-radius:0.75rem;background:transparent;border:1px solid var(--border);padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}.inp:focus{box-shadow:0 0 0 2px color-mix(in oklab, var(--ring) 40%, transparent)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
