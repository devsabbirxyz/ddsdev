import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatBDT } from "@/lib/storefront";
import { deleteProduct } from "@/lib/seller.functions";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const myProductsQuery = queryOptions({
  queryKey: ["seller", "my-products"],
  queryFn: async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return [];
    const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", uid).maybeSingle();
    if (!seller) return [];
    const { data, error } = await supabase
      .from("products")
      .select("id,title,slug,regular_price,offer_price,status,is_active,total_sales,created_at")
      .eq("seller_id", seller.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/seller/products")({
  head: () => ({ meta: [{ title: "My Products — Seller" }, { name: "robots", content: "noindex" }] }),
  component: SellerProducts,
});

function SellerProducts() {
  const { data: products = [], isLoading } = useQuery(myProductsQuery);
  const qc = useQueryClient();
  const del = useServerFn(deleteProduct);

  const onDelete = async (id: string) => {
    if (!confirm("ডিলিট করতে চান?")) return;
    try {
      await del({ data: { id } });
      toast.success("ডিলিট করা হয়েছে");
      qc.invalidateQueries({ queryKey: ["seller", "my-products"] });
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-2xl">আমার প্রোডাক্ট</h1>
        <Link to="/seller/products/new" className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4" /> নতুন প্রোডাক্ট
        </Link>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase">Title</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Price</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Sales</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-bold uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading...</td></tr>}
              {!isLoading && products.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">কোনো প্রোডাক্ট নেই</td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border/40 hover:bg-accent/30">
                  <td className="px-4 py-3 max-w-[260px] truncate">{p.title}</td>
                  <td className="px-4 py-3 font-semibold">{formatBDT(Number(p.offer_price ?? p.regular_price))}</td>
                  <td className="px-4 py-3">{p.total_sales ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      p.status === "approved" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : p.status === "rejected" ? "bg-destructive/15 text-destructive border-destructive/30"
                      : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to="/seller/products/$id" params={{ id: p.id }} className="rounded-lg glass-card px-3 py-1.5 text-xs inline-flex items-center gap-1 hover:bg-accent">
                        <Pencil className="h-3 w-3" /> Edit
                      </Link>
                      <button onClick={() => onDelete(p.id)} className="rounded-lg px-3 py-1.5 text-xs inline-flex items-center gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
