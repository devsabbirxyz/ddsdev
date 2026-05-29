import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { deleteProduct, toggleProductFlag } from "@/lib/admin.functions";
import { formatBDT } from "@/lib/storefront";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star, Trophy, Eye, EyeOff } from "lucide-react";
import { confirmDialog } from "@/components/ui/modal-dialogs";



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

export const Route = createFileRoute("/admin/products/")({
  head: () => ({ meta: [{ title: "Products — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminProducts,
});

function AdminProducts() {
  const { data, isLoading } = useQuery(productsQuery);
  const qc = useQueryClient();
  const nav = useNavigate();
  const del = useServerFn(deleteProduct);
  const toggleFlag = useServerFn(toggleProductFlag);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [pulse, setPulse] = useState<string | null>(null);

  if (isLoading || !data) return <div className="text-muted-foreground">লোড হচ্ছে...</div>;

  const filtered = data
    .filter((p) => filter === "all" || p.status === filter)
    .filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()));

  const createNew = () => {
    nav({ to: "/admin/products/new" as any });
  };

  const onDelete = async (id: string) => {
    if (!(await confirmDialog())) return;
    try {
      await del({ data: { id } });
      toast.success("ডিলিট হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch (e: any) { toast.error(e.message); }
  };

  const onToggle = async (id: string, flag: "is_featured" | "is_best_seller", current: boolean) => {
    const key = `${id}:${flag}`;
    setPulse(key);
    setTimeout(() => setPulse((p) => (p === key ? null : p)), 800);
    // optimistic update
    qc.setQueryData(["admin", "products"], (old: any) =>
      Array.isArray(old) ? old.map((r: any) => (r.id === id ? { ...r, [flag]: !current } : r)) : old,
    );
    try {
      await toggleFlag({ data: { id, flag, value: !current } });
      toast.success(flag === "is_featured" ? "Featured আপডেট হয়েছে!" : "Best Seller আপডেট হয়েছে!");
    } catch (e: any) {
      // revert
      qc.setQueryData(["admin", "products"], (old: any) =>
        Array.isArray(old) ? old.map((r: any) => (r.id === id ? { ...r, [flag]: current } : r)) : old,
      );
      toast.error(e.message || "আপডেট ব্যর্থ হয়েছে, আবার চেষ্টা করুন");
    }
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

      {/* Mobile: swipe-to-reveal card list */}
      <div className="sm:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">কোনো প্রোডাক্ট নেই।</div>
        ) : (
          filtered.map((p: any) => (
            <SwipeRow
              key={p.id}
              onEdit={() => nav({ to: "/admin/products/$id" as any, params: { id: p.id } as any })}
              onDelete={() => onDelete(p.id)}
            >
              <div className="glass-card rounded-2xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold flex items-center gap-2 truncate">
                      {p.is_active ? <Eye className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                      <span className="truncate">{p.title}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate">/{p.slug}</div>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                      <span className="rounded-full px-2 py-0.5 bg-accent">{p.status}</span>
                      <span className="text-muted-foreground">{p.delivery_type}</span>
                      {p.offer_price ? (
                        <span className="font-semibold">{formatBDT(p.offer_price)}</span>
                      ) : p.regular_price ? (
                        <span className="font-semibold">{formatBDT(p.regular_price)}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <button
                      onClick={() => onToggle(p.id, "is_featured", !!p.is_featured)}
                      className={`inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-accent active:scale-90 transition ${pulse === `${p.id}:is_featured` ? "scale-110 animate-pulse" : ""}`}
                    >
                      <Star className={`h-4 w-4 ${p.is_featured ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/40"}`} />
                    </button>
                    <button
                      onClick={() => onToggle(p.id, "is_best_seller", !!p.is_best_seller)}
                      className={`inline-flex items-center justify-center h-7 w-7 rounded-lg hover:bg-accent active:scale-90 transition ${pulse === `${p.id}:is_best_seller` ? "scale-110 animate-pulse" : ""}`}
                    >
                      <Trophy className={`h-4 w-4 ${p.is_best_seller ? "text-[#FF6B35] fill-[#FF6B35]/30" : "text-muted-foreground/40"}`} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground/70">বাম দিকে টান দিন → অ্যাকশন</div>
              </div>
            </SwipeRow>
          ))
        )}
      </div>

      {/* Tablet/Desktop: table */}
      <div className="glass-card rounded-2xl overflow-hidden hidden sm:block">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">কোনো প্রোডাক্ট নেই।</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">প্রোডাক্ট</th>
                <th className="text-left px-4 py-3">টাইপ</th>
                <th className="text-left px-4 py-3">মূল্য</th>
                <th className="text-center px-2 py-3">⭐</th>
                <th className="text-center px-2 py-3">🏆</th>
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
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => onToggle(p.id, "is_featured", !!p.is_featured)}
                      title={p.is_featured ? "Featured (click to remove)" : "Mark as Featured"}
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 hover:bg-accent active:scale-90 ${pulse === `${p.id}:is_featured` ? "scale-110 animate-pulse" : "scale-100"}`}
                    >
                      <Star className={`h-4 w-4 transition-colors ${p.is_featured ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" : "text-muted-foreground/40"}`} />
                    </button>
                  </td>
                  <td className="px-2 py-3 text-center">
                    <button
                      onClick={() => onToggle(p.id, "is_best_seller", !!p.is_best_seller)}
                      title={p.is_best_seller ? "Best Seller (click to remove)" : "Mark as Best Seller"}
                      className={`inline-flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200 hover:bg-accent active:scale-90 ${pulse === `${p.id}:is_best_seller` ? "scale-110 animate-pulse" : "scale-100"}`}
                    >
                      <Trophy className={`h-4 w-4 transition-colors ${p.is_best_seller ? "text-[#FF6B35] fill-[#FF6B35]/30 drop-shadow-[0_0_6px_rgba(255,107,53,0.7)]" : "text-muted-foreground/40"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3"><span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-accent">{p.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link to={"/admin/products/$id" as any} params={{ id: p.id } as any} className="rounded-lg glass-card hover:bg-accent px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1">
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
