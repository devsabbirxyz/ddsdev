import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateBackupBundle } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Database, Download, Calendar, Loader2, FileJson, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/admin/backups")({
  head: () => ({ meta: [{ title: "Backup & Export — Admin" }, { name: "robots", content: "noindex" }] }),
  component: BackupsPage,
});

function toCSV(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Array.from(rows.reduce((s: Set<string>, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()));
  const esc = (v: any) => {
    if (v == null) return "";
    if (typeof v === "object") v = JSON.stringify(v);
    const s = String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(","))].join("\n");
}

function download(name: string, content: string, mime: string) {
  const blob = new Blob(["\uFEFF" + content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

const SCHEDULE_KEY = "dds:auto-backup:schedule";
const LAST_KEY = "dds:auto-backup:last";

function useSchedule() {
  const [schedule, setScheduleState] = useState<string>(() => {
    if (typeof window === "undefined") return "off";
    return localStorage.getItem(SCHEDULE_KEY) || "off";
  });
  const setSchedule = (v: string) => { setScheduleState(v); localStorage.setItem(SCHEDULE_KEY, v); };
  return [schedule, setSchedule] as const;
}

function BackupsPage() {
  const fetchBundle = useServerFn(generateBackupBundle);
  const [busy, setBusy] = useState(false);
  const [schedule, setSchedule] = useSchedule();
  const lastRun = typeof window !== "undefined" ? localStorage.getItem(LAST_KEY) : null;

  const runFullBackup = async (fmt: "json" | "csv") => {
    setBusy(true);
    try {
      const { generatedAt, bundle } = await fetchBundle();
      const ts = new Date(generatedAt).toISOString().replace(/[:.]/g, "-");
      if (fmt === "json") {
        download(`dds-backup-${ts}.json`, JSON.stringify({ generatedAt, bundle }, null, 2), "application/json");
      } else {
        // Zipless multi-CSV: concatenate labeled CSV chunks in one file
        const parts: string[] = [];
        for (const [table, rows] of Object.entries(bundle)) {
          parts.push(`### TABLE: ${table} (${(rows as any[]).length} rows) ###`);
          parts.push(toCSV(rows as any[]));
          parts.push("");
        }
        download(`dds-backup-${ts}.csv`, parts.join("\n"), "text/csv");
      }
      localStorage.setItem(LAST_KEY, generatedAt);
      toast.success("✅ ব্যাকআপ ডাউনলোড হয়েছে");
    } catch (e: any) {
      toast.error(e.message || "Backup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl inline-flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" /> Auto Backup & Export
        </h1>
        <p className="text-sm text-muted-foreground mt-1">সম্পূর্ণ ডেটাবেজের CSV/JSON ব্যাকআপ ডাউনলোড করুন</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="font-bold inline-flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Manual Backup</div>
          <p className="text-xs text-muted-foreground">সব গুরুত্বপূর্ণ টেবিল (orders, products, users, coupons, sellers, subscriptions সহ) একসাথে ডাউনলোড।</p>
          <div className="flex gap-2 flex-wrap">
            <button disabled={busy} onClick={() => runFullBackup("csv")}
              className="rounded-xl bg-gradient-brand text-primary-foreground px-4 py-2 text-sm font-bold shadow-glow inline-flex items-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} CSV ডাউনলোড
            </button>
            <button disabled={busy} onClick={() => runFullBackup("json")}
              className="rounded-xl glass-card px-4 py-2 text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />} JSON ডাউনলোড
            </button>
          </div>
          {lastRun && (
            <div className="text-xs text-muted-foreground">সর্বশেষ ব্যাকআপ: {new Date(lastRun).toLocaleString("bn-BD")}</div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="font-bold inline-flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Auto Schedule</div>
          <p className="text-xs text-muted-foreground">
            আপনি অ্যাডমিন প্যানেলে আসলে সিলেক্ট করা schedule অনুযায়ী স্বয়ংক্রিয়ভাবে ব্যাকআপ ডাউনলোড হবে।
          </p>
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "off", l: "বন্ধ" },
              { v: "daily", l: "দৈনিক" },
              { v: "weekly", l: "সাপ্তাহিক" },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => setSchedule(o.v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${schedule === o.v ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass-card"}`}
              >
                {o.l}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            বর্তমান: <span className="font-bold text-primary">{schedule === "off" ? "বন্ধ" : schedule === "daily" ? "দৈনিক" : "সাপ্তাহিক"}</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 text-xs text-muted-foreground">
        💡 <b>টিপস:</b> ব্যাকআপ ফাইল আপনার লোকাল কম্পিউটারে সেভ হবে। নিরাপদ স্থানে (ক্লাউড স্টোরেজ / ড্রাইভ) কপি রাখুন।
      </div>
    </div>
  );
}
