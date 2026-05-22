import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const ticketQuery = (id: string) =>
  queryOptions({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_tickets").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

const messagesQuery = (id: string) =>
  queryOptions({
    queryKey: ["ticket-messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/tickets/$id")({
  component: TicketDetail,
});

function TicketDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: ticket, isLoading } = useQuery(ticketQuery(id));
  const { data: messages = [] } = useQuery(messagesQuery(id));
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel(`ticket-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${id}` },
        () => qc.invalidateQueries({ queryKey: ["ticket-messages", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  const send = async () => {
    if (!user || !reply.trim() || !ticket) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("ticket_messages").insert({
        ticket_id: id, sender_id: user.id, message: reply.trim(), is_admin_reply: false,
      });
      if (error) throw error;
      setReply("");
      qc.invalidateQueries({ queryKey: ["ticket-messages", id] });
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setBusy(false); }
  };

  const closeTicket = async () => {
    if (!confirm("টিকেট বন্ধ করবেন?")) return;
    const { error } = await supabase.from("support_tickets").update({ status: "closed" }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Closed");
    qc.invalidateQueries({ queryKey: ["ticket", id] });
  };

  if (isLoading) return <p className="text-muted-foreground py-12 text-center">লোড হচ্ছে...</p>;
  if (!ticket) return <p className="py-12 text-center">টিকেট পাওয়া যায়নি</p>;

  const isOpen = ticket.status === "open";

  return (
    <div className="space-y-4 max-w-3xl">
      <Link to="/dashboard/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-xl">{ticket.subject}</h1>
            <p className="text-xs text-muted-foreground font-mono mt-1">{ticket.ticket_number} · {ticket.category}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isOpen ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
            {ticket.status}
          </span>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-6">কোনো মেসেজ নেই</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.is_admin_reply ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              m.is_admin_reply
                ? "bg-accent text-foreground rounded-tl-sm"
                : "bg-gradient-brand text-primary-foreground rounded-tr-sm shadow-glow"
            }`}>
              <div className="text-[10px] opacity-70 mb-0.5">{m.is_admin_reply ? "Admin" : "আপনি"} · {new Date(m.created_at!).toLocaleString("bn-BD")}</div>
              <div className="whitespace-pre-wrap">{m.message}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {isOpen ? (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <textarea
            value={reply} onChange={(e) => setReply(e.target.value)} rows={3}
            placeholder="আপনার রিপ্লাই লিখুন..."
            className="w-full rounded-xl glass px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex justify-between gap-2">
            <button onClick={closeTicket} className="rounded-xl border border-destructive/40 text-destructive px-4 py-2 text-sm hover:bg-destructive/10 inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Close
            </button>
            <button onClick={send} disabled={busy || !reply.trim()} className="rounded-xl bg-gradient-brand px-5 py-2 text-sm font-bold text-primary-foreground shadow-glow inline-flex items-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} পাঠান
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-4">এই টিকেট বন্ধ করা হয়েছে</p>
      )}
    </div>
  );
}
