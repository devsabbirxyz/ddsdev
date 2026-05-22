import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ticketsQuery = (status: string, q: string) =>
  queryOptions({
    queryKey: ["admin", "tickets", status, q],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("id,ticket_number,subject,category,status,user_id,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (status !== "all") query = query.eq("status", status);
      if (q.trim()) query = query.or(`ticket_number.ilike.%${q}%,subject.ilike.%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

export const Route = createFileRoute("/admin/tickets/")({
  head: () => ({ meta: [{ title: "Support Tickets — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTicketsList,
});

function AdminTicketsList() {
  const [status, setStatus] = useState("open");
  const [q, setQ] = useState("");
  const { data: tickets = [], isLoading } = useQuery(ticketsQuery(status, q));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display font-bold text-2xl">সাপোর্ট টিকেট</h1>
        <p className="text-sm text-muted-foreground">কাস্টমার টিকেট ম্যানেজ ও রিপ্লাই করুন</p>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {["open", "closed", "all"].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize transition ${
              status === s ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass-card hover:bg-accent"
            }`}>{s}</button>
        ))}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ticket ID বা subject"
            className="rounded-xl glass pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 w-64" />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background/40">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Ticket</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Subject</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Category</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-bold uppercase text-muted-foreground">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Loading...</td></tr>}
              {!isLoading && tickets.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">কোনো টিকেট নেই</td></tr>
              )}
              {tickets.map((t) => (
                <tr key={t.id} className="border-t border-border/40 hover:bg-accent/30">
                  <td className="px-4 py-3 font-mono text-xs">{t.ticket_number}</td>
                  <td className="px-4 py-3 max-w-[260px] truncate">{t.subject}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      t.status === "open" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.created_at!).toLocaleDateString("bn-BD")}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/admin/tickets/$id" params={{ id: t.id }}
                      className="rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow">
                      Open
                    </Link>
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
