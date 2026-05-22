import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Save, Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveCoupon, deleteCoupon } from "@/lib/admin.functions";

const couponsQuery = queryOptions({
  queryKey: ["admin", "coupons"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminCoupons,
});

type CouponForm = {
  id?: string | null;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  minimum_order?: number;
  max_uses?: number | null;
  max_uses_per_user?: number;
  applies_to?: "all" | "categories" | "products";
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
};

const empty: CouponForm = {
  code: "",
  discount_type: "percentage",
  discount_value: 10,
  minimum_order: 0,
  max_uses: null,
  max_uses_per_user: 1,
  applies_to: "all",
  is_active: true,
};

function toLocal(dt: string | null | undefined) {
  if (!dt) return "";
  return new Date(dt).toISOString().slice(0, 16);
}

function AdminCoupons() {
  const qc = useQueryClient();
  const { data: coupons = [], isLoading } = useQuery(couponsQuery);
  const save = useServerFn(saveCoupon);
  const del = useServerFn(deleteCoupon);
  const [editing, setEditing] = useState<CouponForm | null>(null);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    if (!editing) return;
    if (!editing.code.trim()) { toast.error("কোড দিন"); return; }
    setBusy(true);
    try {
      await save({
        data: {
          ...editing,
          discount_value: Number(editing.discount_value),
          minimum_order: Number(editing.minimum_order ?? 0),
          max_uses: editing.max_uses ? Number(editing.max_uses) : null,
          max_uses_per_user: Number(editing.max_uses_per_user ?? 1),
          start_date: editing.start_date ? new Date(editing.start_date).toISOString() : null,
          end_date: editing.end_date ? new Date(editing.end_date).toISOString() : null,
        } as any,
      });
      await qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("সেভ হয়েছে");
      setEditing(null);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("ডিলিট করবেন?")) return;
    try {
      await del({ data: { id } });
      await qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success("ডিলিট হয়েছে");
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl">কুপন</h1>
          <p className="text-sm text-muted-foreground">ডিসকাউন্ট কুপন তৈরি ও ম্যানেজ করুন</p>
        </div>
        <button
          onClick={() => setEditing({ ...empty })}
          className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> নতুন কুপন
        </button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left">
                <Th>Code</Th><Th>Discount</Th><Th>Min Order</Th>
                <Th>Used</Th><Th>Status</Th><Th>Expires</Th><Th>{" "}</Th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Loading...</td></tr>}
              {!isLoading && coupons.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">কোনো কুপন নেই</td></tr>
              )}
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-border/40 hover:bg-accent/30">
                  <Td>
                    <button
                      onClick={() => { navigator.clipboard.writeText(c.code); toast.success("কপি"); }}
                      className="font-mono font-bold inline-flex items-center gap-1.5 hover:text-primary"
                    >
                      {c.code} <Copy className="h-3 w-3 opacity-60" />
                    </button>
                  </Td>
                  <Td className="font-semibold">
                    {c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${c.discount_value}`}
                  </Td>
                  <Td>৳{c.minimum_order ?? 0}</Td>
                  <Td>{c.used_count ?? 0}{c.max_uses ? ` / ${c.max_uses}` : ""}</Td>
                  <Td>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      c.is_active ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "glass"
                    }`}>{c.is_active ? "Active" : "Off"}</span>
                  </Td>
                  <Td className="text-xs text-muted-foreground">
                    {c.end_date ? new Date(c.end_date).toLocaleDateString("bn-BD") : "—"}
                  </Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => setEditing({
                        ...c,
                        start_date: toLocal(c.start_date),
                        end_date: toLocal(c.end_date),
                      } as any)} className="text-xs rounded-lg glass px-2.5 py-1 hover:bg-accent">Edit</button>
                      <button onClick={() => onDelete(c.id)} className="text-xs rounded-lg border border-destructive/40 text-destructive px-2.5 py-1 hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur grid place-items-center p-4 overflow-y-auto">
          <div className="glass-card rounded-2xl p-6 w-full max-w-xl space-y-4 my-8">
            <h3 className="font-display font-bold text-lg">{editing.id ? "Edit" : "নতুন"} কুপন</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="কোড *"><input className="inp uppercase" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "") })} /></Field>
              <Field label="ধরন">
                <select className="inp" value={editing.discount_type} onChange={(e) => setEditing({ ...editing, discount_type: e.target.value as any })}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed (৳)</option>
                </select>
              </Field>
              <Field label="Discount Value *">
                <input type="number" min={0} className="inp" value={editing.discount_value} onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })} />
              </Field>
              <Field label="Minimum Order (৳)">
                <input type="number" min={0} className="inp" value={editing.minimum_order ?? 0} onChange={(e) => setEditing({ ...editing, minimum_order: Number(e.target.value) })} />
              </Field>
              <Field label="Max Total Uses (0=unlimited)">
                <input type="number" min={0} className="inp" value={editing.max_uses ?? ""} onChange={(e) => setEditing({ ...editing, max_uses: e.target.value ? Number(e.target.value) : null })} />
              </Field>
              <Field label="Max Uses Per User">
                <input type="number" min={1} className="inp" value={editing.max_uses_per_user ?? 1} onChange={(e) => setEditing({ ...editing, max_uses_per_user: Number(e.target.value) })} />
              </Field>
              <Field label="Applies To">
                <select className="inp" value={editing.applies_to ?? "all"} onChange={(e) => setEditing({ ...editing, applies_to: e.target.value as any })}>
                  <option value="all">All Products</option>
                  <option value="categories">Specific Categories</option>
                  <option value="products">Specific Products</option>
                </select>
              </Field>
              <Field label="Start Date">
                <input type="datetime-local" className="inp" value={editing.start_date ?? ""} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} />
              </Field>
              <Field label="End Date">
                <input type="datetime-local" className="inp" value={editing.end_date ?? ""} onChange={(e) => setEditing({ ...editing, end_date: e.target.value })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
              অ্যাক্টিভ
            </label>

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <button onClick={() => setEditing(null)} className="rounded-xl glass px-4 py-2 text-sm hover:bg-accent">বাতিল</button>
              <button onClick={onSave} disabled={busy} className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow inline-flex items-center gap-2 disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} সেভ
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`.inp{width:100%;border-radius:0.75rem;background:transparent;border:1px solid hsl(var(--border));padding:0.5rem 0.75rem;font-size:0.875rem;outline:none}.inp:focus{box-shadow:0 0 0 2px hsl(var(--ring)/.4)}`}</style>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
