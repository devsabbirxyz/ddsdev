import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteProduct, saveProduct } from "@/lib/admin.functions";
import { formatBDT } from "@/lib/storefront";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, Eye, EyeOff } from "lucide-react";

const productsQuery = queryOptions({
  queryKey: ["admin", "products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,title,slug,status,regular_price,offer_price,delivery_type,is_active,is_featured,is_best_seller,is_new_arrival,created_at,seller_id")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

function AdminProducts() {
  const { data, isLoading } = useQuery(productsQuery);
  const qc = useQueryClient();
  const nav = useNavigate();
  const save = useServerFn(saveProduct);
  const del = useServerFn(deleteProduct);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");

  if (isLoading || !data) return <div className="text-muted-foreground">লোড হচ্ছে...</div>;

  const filtered = data
    .filter((p) => filter === "all" || p.status === filter)
    .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  const createNew = async () => {
    try {
      const r = await save({ data: { title: "নতুন প্রোডাক্ট", delivery_type: "instant_text", status: "approved", is_active: false } });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      nav({ to: "/admin/products/$id" as any, params: { id: r.id } });
    } catch (e: any) { toast.error(e.message); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("ডিলিট করবেন? এটি ফেরানো যাবে না।")) return;
    try {
      await del({ data: { id } });
      toast.success("ডিলিট হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl">প্রোডাক্ট ম্যানেজার</h1>
        <button onClick={createNew} className="rounded-xl bg-gradient-brand text-primary-foreground shadow-glow px-4 py-2 text-sm font-bold inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> নতুন প্রোডাক্ট
        </button>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize ${filter === s ? "bg-gradient-brand text-primary-foreground" : "glass-card hover:bg-accent"}`}>
            {s} ({s === "all" ? data.length : data.filter((d) => d.status === s).length})
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="সার্চ..."
          className="ml-auto rounded-xl border border-border bg-background px-3 py-1.5 text-sm w-56"
        />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">কোনো প্রোডাক্ট নেই।</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">প্রোডাক্ট</th>
                <th className="text-left px-4 py-3">টাইপ</th>
                <th className="text-left px-4 py-3">মূল্য</th>
                <th className="text-left px-4 py-3">ট্যাগ</th>
                <th className="text-left px-4 py-3">স্ট্যাটাস</th>
                <th className="text-right px-4 py-3">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="font-semibold flex items-center gap-2">
                      {p.is_active ? <Eye className="h-3.5 w-3.5 text-emerald-500" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      {p.title}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">/{p.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{p.delivery_type}</td>
                  <td className="px-4 py-3">{formatBDT(Number(p.offer_price ?? p.regular_price ?? 0))}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.is_featured && <span title="Featured"><Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /></span>}
                      {p.is_best_seller && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-600">BEST</span>}
                      {p.is_new_arrival && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600">NEW</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent">{p.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link to={"/admin/products/$id" as any} params={{ id: p.id }} className="rounded-lg glass-card hover:bg-accent px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1">
                        <Pencil className="h-3 w-3" /> ইডিট
                      </Link>
                      <button onClick={() => onDelete(p.id)} className="rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1">
                        <Trash2 className="h-3 w-3" /> ডিলিট
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
