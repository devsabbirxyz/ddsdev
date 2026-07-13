import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listAuditLog } from "@/lib/admin.functions";
import { ScrollText, User, Clock, Filter } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({
  head: () => ({ meta: [{ title: "Activity Log — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AuditPage,
});

function AuditPage() {
  const fetchLog = useServerFn(listAuditLog);
  const [actionFilter, setActionFilter] = useState("");
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["admin", "audit", actionFilter],
    queryFn: () => fetchLog({ data: { limit: 300, action: actionFilter || undefined } }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl inline-flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" /> Activity Audit Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">কে কখন কি পরিবর্তন করলো তার সম্পূর্ণ ইতিহাস</p>
      </div>

      <div className="glass-card rounded-2xl p-3 flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <input
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          onBlur={() => refetch()}
          placeholder="Action দিয়ে ফিল্টার করুন (যেমন: order.bulk_approve)"
          className="flex-1 min-w-[200px] rounded-lg bg-background/60 border border-border px-3 py-1.5 text-sm"
        />
        <button onClick={() => { setActionFilter(""); }} className="rounded-lg glass-card px-3 py-1.5 text-xs">Clear</button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Actor</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Entity</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (<tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading...</td></tr>)}
              {!isLoading && data.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">কোনো activity log নেই</td></tr>
              )}
              {data.map((row: any) => (
                <tr key={row.id} className="border-t border-border/40 hover:bg-accent/20 align-top">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    <div className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(row.created_at).toLocaleString("bn-BD")}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="inline-flex items-center gap-1"><User className="h-3 w-3 text-primary" />
                      <span className="font-mono">{row.actor_email || row.actor_id?.slice(0, 8) || "system"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2 py-0.5 text-xs font-bold">{row.action}</span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.entity_type ? (
                      <>
                        <div className="font-semibold">{row.entity_type}</div>
                        {row.entity_id && <div className="font-mono text-muted-foreground truncate max-w-[160px]">{row.entity_id}</div>}
                      </>
                    ) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {row.details ? <pre className="whitespace-pre-wrap font-mono text-[11px] text-muted-foreground max-w-[360px]">{JSON.stringify(row.details, null, 0)}</pre> : "—"}
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
