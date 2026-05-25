import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { saveSettingsBulk } from "@/lib/admin.functions";
import { testTelegramNotification } from "@/lib/telegram.functions";
import { toast } from "sonner";
import { Send, Save, MessageCircle, Loader2 } from "lucide-react";

const settingsQuery = queryOptions({
  queryKey: ["admin", "telegram-settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["telegram_bot_token", "telegram_chat_id"]);
    if (error) throw error;
    const map: Record<string, string> = {};
    for (const r of data ?? []) map[r.key] = r.value ?? "";
    return map;
  },
});

export const Route = createFileRoute("/admin/telegram")({
  head: () => ({ meta: [{ title: "Telegram Notifications — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminTelegram,
});

function AdminTelegram() {
  const { data, isLoading } = useQuery(settingsQuery);
  const qc = useQueryClient();
  const saveBulk = useServerFn(saveSettingsBulk);
  const test = useServerFn(testTelegramNotification);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!data) return;
    setBotToken(data.telegram_bot_token ?? "");
    setChatId(data.telegram_chat_id ?? "");
  }, [data]);

  const save = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error("Bot Token ও Chat ID দুটোই দিন");
      return;
    }
    setSaving(true);
    try {
      await saveBulk({
        data: {
          items: [
            { key: "telegram_bot_token", value: botToken.trim(), group_name: "telegram" },
            { key: "telegram_chat_id", value: chatId.trim(), group_name: "telegram" },
          ],
        },
      });
      toast.success("✅ সেটিংস সফলভাবে সেভ হয়েছে!");
      qc.invalidateQueries({ queryKey: ["admin", "telegram-settings"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Save ব্যর্থ");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast.error("আগে Bot Token ও Chat ID দিন");
      return;
    }
    setTesting(true);
    try {
      await test({ data: { bot_token: botToken.trim(), chat_id: chatId.trim() } });
      toast.success("✅ টেস্ট নোটিফিকেশন পাঠানো হয়েছে!");
    } catch {
      toast.error("❌ Bot Token বা Chat ID সঠিক নয়!");
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="font-display font-bold text-2xl">টেলিগ্রাম নোটিফিকেশন সেটিংস</h1>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold mb-2">Bot Token</label>
          <input
            type="text"
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder="আপনার Telegram Bot Token দিন"
            className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-muted-foreground mt-1.5">@BotFather থেকে bot তৈরি করে token নিন</p>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2">Chat ID</label>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="আপনার Telegram Chat ID দিন"
            className="w-full rounded-xl border border-border bg-transparent px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-muted-foreground mt-1.5">@userinfobot এ message পাঠিয়ে আপনার Chat ID পাবেন</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-green-600 hover:bg-green-700 px-6 py-3 font-bold text-white shadow-lg inline-flex items-center gap-2 disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          সেটিংস সেভ করুন
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="font-bold text-lg">টেস্ট নোটিফিকেশন</h2>
          <p className="text-xs text-muted-foreground mt-1">আপনার সেটিংস ঠিক আছে কিনা যাচাই করুন</p>
        </div>
        <button
          onClick={sendTest}
          disabled={testing}
          className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 font-bold text-white shadow-lg inline-flex items-center gap-2 disabled:opacity-60 transition"
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          টেস্ট নোটিফিকেশন পাঠান
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 space-y-3">
        <h3 className="font-bold">কখন নোটিফিকেশন পাঠানো হবে?</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>🛒 নতুন অর্ডার তৈরি হলে</li>
          <li>👤 নতুন কাস্টমার রেজিস্ট্রেশন করলে</li>
          <li>🎫 নতুন সাপোর্ট টিকেট আসলে</li>
          <li>🔑 পাসওয়ার্ড রিসেট রিকোয়েস্ট আসলে</li>
          <li>💳 নতুন পেমেন্ট সাবমিট হলে</li>
        </ul>
      </div>
    </div>
  );
}
