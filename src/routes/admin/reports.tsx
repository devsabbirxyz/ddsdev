import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, FileSpreadsheet, ShoppingBag, Package, Users, Wallet, Ticket, Store } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Reports — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminReports,
});

type ReportKey = "orders" | "products" | "customers" | "sales_summary" | "coupons" | "withdrawals" | "sellers";

const REPORTS: { key: ReportKey; label: string; desc: string; icon: any; accent: string }[] = [
  { key: "orders", label: "অর্ডার রিপোর্ট", desc: "সকল অর্ডার (তারিখ ফিল্টার সহ)", icon: ShoppingBag, accent: "purple" },
  { key: "sales_summary", label: "সেলস সামারি", desc: "দৈনিক সেলস সামারি", icon: FileSpreadsheet, accent: "blue" },
  { key: "products", label: "প্রোডাক্ট রিপোর্ট", desc: "সব প্রোডাক্ট ও স্টক", icon: Package, accent: "emerald" },
  { key: "customers", label: "কাস্টমার রিপোর্ট", desc: "সব রেজিস্টার্ড ইউজার", icon: Users, accent: "amber" },
  { key: "coupons", label: "কুপন রিপোর্ট", desc: "সব কুপন ও ব্যবহার", icon: Ticket, accent: "purple" },
  { key: "withdrawals", label: "উইথড্র রিপোর্ট", desc: "সেলার + অ্যাফিলিয়েট উইথড্র", icon: Wallet, accent: "blue" },
  { key: "sellers", label: "সেলার রিপোর্ট", desc: "সব সেলার অ্যাকাউন্ট", icon: Store, accent: "emerald" },
];

function toCSV(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Array.from(rows.reduce((s, r) => { Object.keys(r).forEach((k) => s.add(k)); return s; }, new Set<string>()));
  const esc = (v: any) => {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") v = JSON.stringify(v);
    const s = String(v).replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc((r as any)[h])).join(","))].join("\n");
}

function download(filename: string, csv: string) {
  // BOM ensures Excel opens Bangla/UTF-8 correctly
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

async function fetchReport(key: ReportKey, from?: string, to?: string): Promise<any[]> {
  const range = (q: any) => {
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) q = q.lte("created_at", new Date(new Date(to).getTime() + 86400000).toISOString());
    return q;
  };
  switch (key) {
    case "orders": {
      const { data, error } = await range(supabase.from("orders").select("*").order("created_at", { ascending: false }));
      if (error) throw error; return data ?? [];
    }
    case "sales_summary": {
      const { data, error } = await range(supabase.from("orders").select("created_at,total_price,status").order("created_at", { ascending: false }));
      if (error) throw error;
      const map = new Map<string, { date: string; orders: number; revenue: number; completed: number; pending: number }>();
      (data ?? []).forEach((o: any) => {
        const d = new Date(o.created_at).toISOString().slice(0, 10);
        const row = map.get(d) ?? { date: d, orders: 0, revenue: 0, completed: 0, pending: 0 };
        row.orders++;
        row.revenue += Number(o.total_price ?? 0);
        if (o.status === "completed") row.completed++;
        if (o.status === "pending") row.pending++;
        map.set(d, row);
      });
      return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    }
    case "products": {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    }
    case "customers": {
      const { data, error } = await supabase.from("users").select("id,email,full_name,phone,wallet_points,referral_code,created_at").order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    }
    case "coupons": {
      const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    }
    case "withdrawals": {
      const [s, a] = await Promise.all([
        supabase.from("seller_withdrawals").select("*").order("created_at", { ascending: false }),
        supabase.from("affiliate_withdrawals").select("*").order("created_at", { ascending: false }),
      ]);
      if (s.error) throw s.error; if (a.error) throw a.error;
      return [
        ...(s.data ?? []).map((r) => ({ kind: "seller", ...r })),
        ...(a.data ?? []).map((r) => ({ kind: "affiliate", ...r })),
      ];
    }
    case "sellers": {
      const { data, error } = await supabase.from("sellers").select("*").order("created_at", { ascending: false });
      if (error) throw error; return data ?? [];
    }
  }
}

function AdminReports() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<ReportKey | null>(null);

  const handleExport = async (key: ReportKey, label: string) => {
    setBusy(key);
    try {
      const rows = await fetchReport(key, from || undefined, to || undefined);
      if (!rows.length) { toast.error("কোন ডেটা নেই"); return; }
      const stamp = new Date().toISOString().slice(0, 10);
      download(`${key}_${stamp}.csv`, toCSV(rows));
      toast.success(`${label} — ${rows.length} সারি এক্সপোর্ট হয়েছে`);
    } catch (e: any) {
      toast.error(e.message || "Export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">রিপোর্ট</h1>
        <p className="text-sm text-muted-foreground mt-1">যেকোন রিপোর্ট Excel/CSV ফরম্যাটে ডাউনলোড করুন</p>
      </div>

      <div className="glass-card rounded-2xl p-4 sm:p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">ডেট ফিল্টার (অর্ডার ও সেলস সামারি এর জন্য)</div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">থেকে</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-primary/40" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">পর্যন্ত</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-primary/40" />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setFrom(""); setTo(""); }}
              className="rounded-xl px-4 py-2 text-sm border border-white/15 hover:bg-white/5 transition">
              রিসেট
            </button>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((r) => (
          <div key={r.key} className="stat-card" style={{ ["--stat-accent" as any]: `var(--admin-accent-${r.accent})` }}>
            <div className="flex items-start gap-3">
              <div className="stat-icon"><r.icon className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="font-display font-bold text-base">{r.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
              </div>
            </div>
            <button
              onClick={() => handleExport(r.key, r.label)}
              disabled={busy === r.key}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-primary-foreground bg-gradient-brand shadow-glow hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100"
            >
              <Download className="h-4 w-4" />
              {busy === r.key ? "এক্সপোর্ট হচ্ছে..." : "Excel ডাউনলোড"}
            </button>
          </div>
        ))}
      </div>

      <div className="text-xs text-muted-foreground">
        💡 CSV ফাইল Microsoft Excel, Google Sheets, বা LibreOffice-এ ওপেন হবে। বাংলা লেখা সঠিকভাবে দেখাতে UTF-8 BOM যুক্ত করা আছে।
      </div>
    </div>
  );
}
