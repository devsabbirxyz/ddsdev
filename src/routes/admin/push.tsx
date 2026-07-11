import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Bell, Send, Users, CheckCircle2, XCircle } from "lucide-react";
import { adminBroadcastPush, adminListPushLog } from "@/lib/push.functions";

export const Route = createFileRoute("/admin/push")({
  head: () => ({ meta: [{ title: "Push Notifications — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminPush,
});

function AdminPush() {
  const qc = useQueryClient();
  const broadcast = useServerFn(adminBroadcastPush);
  const listLog = useServerFn(adminListPushLog);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "push-log"], queryFn: () => listLog() });

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/shop");
  const [sending, setSending] = useState(false);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    if (!confirm(`সব active subscriber-এ পাঠাব? (${data?.totalSubs ?? 0} জন)`)) return;
    setSending(true);
    try {
      const res = await broadcast({ data: { title, body, url } });
      toast.success(`পাঠানো হয়েছে ✅ Sent: ${res.sent}, Failed: ${res.failed}`);
      setTitle(""); setBody("");
      qc.invalidateQueries({ queryKey: ["admin", "push-log"] });
    } catch (e: any) {
      toast.error(e.message || "পাঠানো যায়নি");
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">পুশ নোটিফিকেশন</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browser-এর মাধ্যমে সব সাবস্ক্রাইবার-কে instant notification পাঠান
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Active Subscribers</div>
              <div className="font-display font-bold text-2xl">{data?.totalSubs ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={send} className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Broadcast পাঠান</h2>
        <div>
          <label className="text-xs text-muted-foreground">Title *</label>
          <input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="🔥 Flash Sale চলছে!" className="w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm mt-1" />
          <div className="text-xs text-muted-foreground mt-1">{title.length}/100</div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Message *</label>
          <textarea required maxLength={300} rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="সব প্রিমিয়াম প্রোডাক্টে ৫০% ছাড়। শুধু আজকের জন্য।" className="w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm mt-1" />
          <div className="text-xs text-muted-foreground mt-1">{body.length}/300</div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Click URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/shop" className="w-full rounded-xl border border-border bg-transparent px-3 py-2.5 text-sm mt-1" />
        </div>
        <button type="submit" disabled={sending || !title.trim() || !body.trim()} className="rounded-xl bg-gradient-brand px-5 py-2.5 font-bold text-primary-foreground shadow-glow text-sm inline-flex items-center gap-2 disabled:opacity-50">
          <Send className="h-4 w-4" /> {sending ? "পাঠাচ্ছে..." : `Broadcast পাঠান (${data?.totalSubs ?? 0} জন)`}
        </button>
      </form>

      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2"><Bell className="h-4 w-4" /> সাম্প্রতিক নোটিফিকেশন</h3>
        {isLoading ? (
          <div className="text-muted-foreground">লোড হচ্ছে...</div>
        ) : !data?.log?.length ? (
          <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">এখনো কোনো push পাঠানো হয়নি</div>
        ) : (
          <div className="glass-card rounded-2xl divide-y divide-glass-border">
            {data.log.map((l: any) => (
              <div key={l.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-2 py-0.5 rounded">{l.event_type}</span>
                      <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("bn-BD")}</span>
                    </div>
                    <div className="font-bold text-sm">{l.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{l.body}</div>
                  </div>
                  <div className="text-right shrink-0 text-xs">
                    <div className="text-emerald-500 font-bold inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {l.sent_count}</div>
                    {l.failed_count > 0 && <div className="text-destructive font-bold inline-flex items-center gap-1"><XCircle className="h-3 w-3" /> {l.failed_count}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
