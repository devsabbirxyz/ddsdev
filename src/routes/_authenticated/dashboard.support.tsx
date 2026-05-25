import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { LifeBuoy, Plus, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/telegram-notify";

const ticketsQuery = (userId?: string) =>
  queryOptions({
    queryKey: ["my-tickets", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id,ticket_number,subject,category,status,created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

export const Route = createFileRoute("/_authenticated/dashboard/support")({
  component: SupportPage,
});

function SupportPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: tickets = [] } = useQuery(ticketsQuery(user?.id));
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user) return;
    if (!subject.trim() || !message.trim()) { toast.error("সব ফিল্ড পূরণ করুন"); return; }
    setBusy(true);
    try {
      const ticket_number = `T-${Date.now().toString(36).toUpperCase()}`;
      const { data: t, error } = await supabase.from("support_tickets").insert({
        user_id: user.id, subject: subject.trim(), category, ticket_number, status: "open",
      }).select("id").single();
      if (error) throw error;
      await supabase.from("ticket_messages").insert({ ticket_id: t.id, sender_id: user.id, message: message.trim(), is_admin_reply: false });
      notify.newTicket({
        name: user.email ?? "অজানা",
        subject: subject.trim(),
        message: message.trim(),
      });
      toast.success("টিকেট তৈরি হয়েছে");
      setSubject(""); setMessage(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["my-tickets"] });
    } catch (e: any) {
      toast.error(e?.message ?? "টিকেট তৈরি ব্যর্থ");
    } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">সাপোর্ট টিকেট</h1>
        <button onClick={() => setOpen(true)} className="rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow inline-flex items-center gap-2"><Plus className="h-4 w-4" /> নতুন টিকেট</button>
      </div>

      {tickets.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <LifeBuoy className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">কোনো টিকেট নেই</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} to="/dashboard/tickets/$id" params={{ id: t.id }}
              className="glass-card rounded-2xl p-5 flex items-center justify-between gap-3 hover:bg-accent/30 transition">
              <div>
                <div className="font-semibold">{t.subject}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-mono">{t.ticket_number} · {t.category}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{new Date(t.created_at!).toLocaleString("bn-BD")}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${t.status === "open" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{t.status}</span>
            </Link>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="glass-card rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-lg">নতুন টিকেট</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1.5 block">সাবজেক্ট *</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-xl glass px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block">ক্যাটাগরি</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl glass px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40">
                  <option value="general">সাধারণ</option>
                  <option value="order">অর্ডার সম্পর্কিত</option>
                  <option value="payment">পেমেন্ট</option>
                  <option value="delivery">ডেলিভারি</option>
                  <option value="refund">রিফান্ড</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block">মেসেজ *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-xl glass px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <button onClick={submit} disabled={busy} className="w-full rounded-xl bg-gradient-brand px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-glow inline-flex items-center justify-center gap-2 disabled:opacity-60">
                <Send className="h-4 w-4" /> {busy ? "পাঠানো হচ্ছে..." : "জমা দিন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
