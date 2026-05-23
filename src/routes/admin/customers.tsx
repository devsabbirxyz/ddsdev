import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Ban, CheckCircle2, Users } from "lucide-react";

const customersQuery = queryOptions({
  queryKey: ["admin", "customers"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id,email,full_name,phone,is_banned,created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return data ?? [];
  },
});

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin" }, { name: "robots", content: "noindex" }] }),
  component: Customers,
});

function Customers() {
  const { data, isLoading } = useQuery(customersQuery);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "banned">("all");

  const toggleBan = async (id: string, current: boolean) => {
    if (!confirm(current ? "এই ইউজার আনব্যান করবেন?" : "⚠️ এই ইউজার ব্যান করবেন?")) return;
    try {
      const { error } = await supabase.from("users").update({ is_banned: !current }).eq("id", id);
      if (error) throw error;
      toast.success(current ? "✅ আনব্যান হয়েছে" : "✅ ব্যান হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "customers"] });
    } catch (e: any) {
      toast.error(`❌ ${e.message || "সমস্যা হয়েছে"}`);
    }
  };

  if (isLoading || !data) return <div className="text-muted-foreground">লোড হচ্ছে...</div>;

  const filtered = data
    .filter((u) => filter === "all" || (filter === "banned" ? u.is_banned : !u.is_banned))
    .filter((u) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (u.email ?? "").toLowerCase().includes(s) || (u.full_name ?? "").toLowerCase().includes(s) || (u.phone ?? "").includes(s);
    });

  const activeCount = data.filter((u) => !u.is_banned).length;
  const bannedCount = data.filter((u) => u.is_banned).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl inline-flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> কাস্টমার লিস্ট
        </h1>
        <div className="text-sm text-muted-foreground">মোট {data.length} জন</div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([
          ["all", `সব (${data.length})`],
          ["active", `অ্যাক্টিভ (${activeCount})`],
          ["banned", `ব্যানড (${bannedCount})`],
        ] as const).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setFilter(k as any)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${filter === k ? "bg-gradient-brand text-primary-foreground" : "glass-card hover:bg-accent"}`}
          >
            {l}
          </button>
        ))}
        <div className="ml-auto relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ইমেইল / নাম / ফোন..."
            className="rounded-xl border border-border bg-background pl-9 pr-3 py-1.5 text-sm w-64"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">কোনো কাস্টমার নেই।</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">কাস্টমার</th>
                  <th className="text-left px-4 py-3">ফোন</th>
                  <th className="text-left px-4 py-3">যোগদান</th>
                  <th className="text-left px-4 py-3">স্ট্যাটাস</th>
                  <th className="text-right px-4 py-3">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u: any) => (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{u.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">{u.phone || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_banned ? (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-destructive/15 text-destructive">Banned</span>
                      ) : (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold bg-emerald-500/15 text-emerald-600">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleBan(u.id, !!u.is_banned)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-bold inline-flex items-center gap-1 ${u.is_banned ? "border border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10" : "border border-destructive/40 text-destructive hover:bg-destructive/10"}`}
                      >
                        {u.is_banned ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> আনব্যান
                          </>
                        ) : (
                          <>
                            <Ban className="h-3 w-3" /> ব্যান
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
