import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Tag, Loader2, Copy, Wallet, CreditCard, Minus, Plus, Trash2, X, Zap, AlertTriangle, Package, ChevronRight, ArrowLeft, Hand } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatBDT } from "@/lib/storefront";
import { notify } from "@/lib/telegram-notify";
import { placeOrder } from "@/lib/orders.functions";
import { walletQuery } from "@/lib/wallet";
import logoBkash from "@/assets/pay-bkash.png";
import logoNagad from "@/assets/pay-nagad.png";
import logoRocket from "@/assets/pay-rocket.png";
import logoUpay from "@/assets/pay-upay.png";

const METHOD_LOGO: Record<string, string> = {
  bkash: logoBkash,
  nagad: logoNagad,
  rocket: logoRocket,
  upay: logoUpay,
};
function logoFor(name?: string | null) {
  if (!name) return null;
  const k = name.toLowerCase().replace(/\s+/g, "");
  for (const key of Object.keys(METHOD_LOGO)) if (k.includes(key)) return METHOD_LOGO[key];
  return null;
}

type BrandInfo = { label: string; gradient: string; color: string };
const METHOD_BRAND: Record<string, BrandInfo> = {
  bkash: { label: "bKash", gradient: "linear-gradient(135deg, #D4106C, #E2136E)", color: "#E2136E" },
  nagad: { label: "Nagad", gradient: "linear-gradient(135deg, #F15A22, #FF7A45)", color: "#F15A22" },
  rocket: { label: "Rocket", gradient: "linear-gradient(135deg, #8B1FA8, #A020C8)", color: "#8B1FA8" },
  upay: { label: "Upay", gradient: "linear-gradient(135deg, #0066CC, #0088FF)", color: "#0066CC" },
};
function brandFor(name?: string | null): BrandInfo | null {
  if (!name) return null;
  const k = name.toLowerCase().replace(/\s+/g, "");
  for (const key of Object.keys(METHOD_BRAND)) if (k.includes(key)) return METHOD_BRAND[key];
  return null;
}

const paymentMethodsQuery = queryOptions({
  queryKey: ["payment_methods", "active"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("id,name,name_en,account_type,send_type,account_number,instructions,is_manual_active,is_automatic_active,has_automatic,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).filter((m) => m.is_manual_active || (m.has_automatic && m.is_automatic_active));
  },
});

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "চেকআউট — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clear, updateQty, removeItem } = useCart();
  const nav = useNavigate();
  const { data: methods = [] } = useQuery(paymentMethodsQuery);
  const { data: wallet } = useQuery({ ...walletQuery(), enabled: !!user });
  const walletBalance = wallet?.balance ?? 0;

  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [customerInput, setCustomerInput] = useState("");
  const [methodId, setMethodId] = useState<string>("");
  const [trxId, setTrxId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [showPayment, setShowPayment] = useState(false);
  const [modalStep, setModalStep] = useState<"methods" | "choice" | "manual">("methods");
  const [payChoice, setPayChoice] = useState<"auto" | "manual" | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [trxError, setTrxError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const method = methods.find((m) => m.id === methodId);
  const brand = brandFor(method?.name);
  const discount = coupon?.discount ?? 0;
  const maxRedeem = useMemo(
    () => Math.max(0, Math.min(walletBalance, subtotal - discount)),
    [walletBalance, subtotal, discount],
  );
  const safeRedeem = Math.max(0, Math.min(redeemPoints, maxRedeem));
  const total = useMemo(
    () => Math.max(0, subtotal - discount - safeRedeem),
    [subtotal, discount, safeRedeem],
  );

  const validateInfo = (): boolean => {
    const defs = [
      { key: "name", label: "পূর্ণ নাম", value: name },
      { key: "phone", label: "ফোন নম্বর", value: phone },
      { key: "email", label: "ইমেইল", value: email, validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
    ];
    const newErrors: Record<string, boolean> = {};
    let firstInvalid: string | null = null;
    let firstLabel = "";
    let formatBadFirst = false;
    for (const f of defs) {
      const empty = !f.value.trim();
      const formatBad = !empty && f.validate ? !f.validate(f.value) : false;
      if (empty || formatBad) {
        newErrors[f.key] = true;
        if (!firstInvalid) { firstInvalid = f.key; firstLabel = f.label; formatBadFirst = formatBad; }
      }
    }
    setErrors(newErrors);
    if (firstInvalid) {
      toast.error(formatBadFirst ? `⚠️ সঠিক ${firstLabel} দিন!` : `⚠️ অনুগ্রহ করে ${firstLabel} পূরণ করুন!`, { position: "bottom-center" });
      if (typeof document !== "undefined") {
        const el = document.getElementById(`field-${firstInvalid}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => (el as HTMLElement).focus?.(), 300);
        }
      }
      return false;
    }
    return true;
  };

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const { data, error } = await supabase
      .from("coupons")
      .select("code,discount_type,discount_value,minimum_order,is_active,start_date,end_date")
      .ilike("code", code)
      .maybeSingle();
    if (error || !data) { setCoupon(null); setCouponMsg({ ok: false, text: "❌ কুপন কোড সঠিক নয়" }); return; }
    if (!data.is_active) { setCoupon(null); setCouponMsg({ ok: false, text: "❌ কুপন সক্রিয় নয়" }); return; }
    const now = new Date();
    if (data.start_date && new Date(data.start_date) > now) { setCoupon(null); setCouponMsg({ ok: false, text: "❌ কুপন এখনো সক্রিয় হয়নি" }); return; }
    if (data.end_date && new Date(data.end_date) < now) { setCoupon(null); setCouponMsg({ ok: false, text: "❌ কুপন মেয়াদ শেষ" }); return; }
    if (subtotal < Number(data.minimum_order ?? 0)) { setCoupon(null); setCouponMsg({ ok: false, text: `❌ নূন্যতম অর্ডার ${formatBDT(data.minimum_order)}` }); return; }
    const isPercent = data.discount_type === "percentage" || data.discount_type === "percent";
    const disc = isPercent
      ? Math.round((subtotal * Number(data.discount_value)) / 100)
      : Number(data.discount_value);
    const final = Math.min(disc, subtotal);
    setCoupon({ code: data.code, discount: final });
    setCouponMsg({ ok: true, text: `✅ ৳${final} ছাড় পেয়েছেন!` });
  };

  const handlePayNow = () => {
    if (items.length === 0) { toast.error("কার্ট খালি"); return; }
    if (!validateInfo()) return;
    setModalStep("methods");
    setMethodId("");
    setTrxId("");
    setTrxError(false);
    setShowPayment(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setShowPayment(false);
    setMethodId("");
    setTrxId("");
    setTrxError(false);
    setModalStep("methods");
  };

  const copyNumber = async () => {
    if (!method?.account_number) return;
    try {
      await navigator.clipboard.writeText(method.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("কপি করা যায়নি");
    }
  };

  const submit = async () => {
    if (!user) { toast.error("লগইন করুন"); return; }
    if (items.length === 0) { toast.error("কার্ট খালি"); return; }
    if (!methodId || !method) { toast.error("পেমেন্ট মেথড সিলেক্ট করুন"); return; }
    if (!trxId.trim()) { setTrxError(true); toast.error("Transaction ID দিন"); return; }

    setSubmitting(true);
    try {
      const result = await placeOrder({
        data: {
          items: items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId ?? null,
            planId: it.planId ?? null,
            quantity: it.quantity,
          })),
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            input: customerInput.trim() || null,
          },
          paymentMethodId: methodId,
          transactionId: trxId.trim() || null,
          couponCode: coupon?.code ?? null,
          redeemPoints: safeRedeem || null,
        },
      });

      notify.newOrder({
        name: name.trim(),
        phone: phone.trim(),
        product: result.firstTitle + (result.itemCount > 1 ? ` (+${result.itemCount - 1} আরো)` : ""),
        amount: result.totalAmount,
      });
      if (trxId.trim()) {
        notify.paymentSubmit({
          name: name.trim(),
          amount: result.totalAmount,
          method: result.paymentMethod,
          trxId: trxId.trim(),
        });
      }
      const orderId = (result as any).orderId ?? (result as any).id ?? "";
      clear();
      setShowPayment(false);
      setSuccessOrderId(String(orderId || "DSS-" + Date.now().toString().slice(-6)));
    } catch (e: any) {
      console.error("Order create failed:", e);
      toast.error(e?.message ?? "অর্ডার তৈরি ব্যর্থ");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && !successOrderId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display font-bold text-2xl">কার্ট খালি</h1>
        <Link to="/shop" className="mt-4 inline-block rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">শপে যান</Link>
      </div>
    );
  }

  const instructionLines = (method?.instructions || "").split("\n").map((l) => l.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-6">চেকআউট</h1>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* LEFT */}
        <div className="space-y-5">
          <section className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-4">অর্ডার সারমর্ম</h2>
            <div className="space-y-3">
              {items.map((it) => (
                <div key={`${it.productId}-${it.variantId ?? ""}`} className="flex gap-3 items-start">
                  <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden glass grid place-items-center">
                    {it.image ? (
                      <img src={it.image} alt={it.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display font-bold text-sm text-gradient-brand">{it.title.slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm line-clamp-1">{it.title}</div>
                    {(it.variantLabel || it.planLabel) && (
                      <div className="text-xs text-muted-foreground mt-0.5">{it.planLabel || it.variantLabel}</div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
                      {it.planId ? (
                        <span className="text-xs text-muted-foreground">সাবস্ক্রিপশন × 1</span>
                      ) : (
                        <div className="inline-flex items-center rounded-lg glass p-0.5">
                          <button onClick={() => updateQty(it.productId, it.quantity - 1, it.variantId)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-accent disabled:opacity-40" disabled={it.quantity <= 1} aria-label="কমান"><Minus className="h-3 w-3" /></button>
                          <span className="px-2.5 text-xs font-semibold min-w-6 text-center">{it.quantity}</span>
                          <button onClick={() => updateQty(it.productId, it.quantity + 1, it.variantId)} className="grid h-7 w-7 place-items-center rounded-md hover:bg-accent" aria-label="বাড়ান"><Plus className="h-3 w-3" /></button>
                        </div>
                      )}
                      <div className="font-display font-bold text-sm text-gradient-brand">
                        {formatBDT(it.price * it.quantity)}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem(it.productId, it.variantId)} className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground hover:text-destructive transition" aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-3 inline-flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" /> কুপন কোড
            </h2>
            <div className="flex gap-2">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="কুপন কোড লিখুন" className="flex-1 rounded-xl glass px-4 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/40" />
              <button onClick={applyCoupon} className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition">প্রয়োগ</button>
            </div>
            {couponMsg && (
              <div className={`mt-2 text-xs font-semibold ${couponMsg.ok ? "text-primary" : "text-destructive"}`}>{couponMsg.text}</div>
            )}
          </section>

          {walletBalance > 0 && (
            <section className="glass-card rounded-2xl p-5">
              <h2 className="font-display font-bold text-lg mb-3 inline-flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> ওয়ালেট পয়েন্ট
                <span className="text-xs text-muted-foreground font-normal">(ব্যালেন্স: {walletBalance})</span>
              </h2>
              <div className="flex gap-2">
                <input type="number" min={0} max={maxRedeem} value={redeemPoints || ""} onChange={(e) => setRedeemPoints(Math.max(0, Math.min(maxRedeem, Number(e.target.value) || 0)))} placeholder="0" className="flex-1 rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
                <button onClick={() => setRedeemPoints(maxRedeem)} className="rounded-xl glass px-4 py-2.5 text-xs font-semibold hover:bg-accent">সর্বোচ্চ</button>
              </div>
              {safeRedeem > 0 && (
                <div className="mt-2 text-xs text-primary inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> − {formatBDT(safeRedeem)} (1 পয়েন্ট = 1৳)</div>
              )}
            </section>
          )}
        </div>

        {/* RIGHT */}
        <aside className="space-y-5 lg:sticky lg:top-24 h-fit">
          <section className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-4">কাস্টমার তথ্য</h2>
            <div className="space-y-3">
              <Field id="field-name" label="পূর্ণ নাম *" value={name} onChange={(v) => { setName(v); if (errors.name) setErrors({ ...errors, name: false }); }} placeholder="Md. Sabbir" error={!!errors.name} />
              <Field id="field-phone" label="ফোন নম্বর *" value={phone} onChange={(v) => { setPhone(v); if (errors.phone) setErrors({ ...errors, phone: false }); }} placeholder="01XXXXXXXXX" error={!!errors.phone} />
              <Field id="field-email" label="ইমেইল *" value={email} onChange={(v) => { setEmail(v); if (errors.email) setErrors({ ...errors, email: false }); }} placeholder="you@example.com" type="email" error={!!errors.email} />
              <div>
                <label className="text-xs font-semibold mb-1.5 block">প্রোডাক্টের জন্য তথ্য (ইমেইল/ইউজারনেম) — ঐচ্ছিক</label>
                <textarea id="field-customerInput" value={customerInput} onChange={(e) => setCustomerInput(e.target.value)} rows={2} placeholder="যেকোনো অতিরিক্ত তথ্য" className="w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
          </section>

          <section className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-3">প্রাইস সারমর্ম</h2>
            <div className="space-y-2 text-sm">
              <Row label="মূল দাম" value={formatBDT(subtotal)} />
              {discount > 0 && <Row label="কুপন ছাড়" value={`− ${formatBDT(discount)}`} accent />}
              {safeRedeem > 0 && <Row label="ওয়ালেট" value={`− ${formatBDT(safeRedeem)}`} accent />}
              <div className="border-t border-border pt-2 mt-2 flex justify-between">
                <span className="font-bold">সর্বমোট</span>
                <span className="font-display font-bold text-2xl text-gradient-brand">{formatBDT(total)}</span>
              </div>
            </div>

            <button onClick={handlePayNow} className="mt-4 w-full rounded-2xl bg-gradient-brand px-6 py-3.5 text-base font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition inline-flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5" /> এখনই পেমেন্ট করুন
            </button>
            <p className="mt-2 text-[11px] text-center text-muted-foreground">অ্যাডমিন verify করার পর ডেলিভারি হবে।</p>
          </section>
        </aside>
      </div>

      {/* ================= PAYMENT MODAL ================= */}
      {showPayment && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-[440px] max-h-[92vh] flex flex-col bg-white shadow-2xl animate-scale-in"
            style={{ borderRadius: "20px 20px 0 0", color: "#111111" }}
          >
            <style>{`@media (min-width: 640px){.pay-sheet{border-radius:20px !important}}`}</style>
            <div className="pay-sheet contents" />

            <button
              onClick={closeModal}
              className="absolute top-3 right-3 z-10 h-9 w-9 grid place-items-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* ---------- Scrollable content ---------- */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 pt-6 pb-4">
              {/* ============ STEP 1: METHOD GRID ============ */}
              {modalStep === "methods" && (
                <div className="animate-fade-in">
                  {/* Header — logo + site name */}
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="h-14 w-14 rounded-2xl grid place-items-center font-display font-black text-white text-xl shadow-md"
                      style={{ background: "linear-gradient(135deg, #1A56DB, #2563EB)" }}
                    >
                      DSS
                    </div>
                    <div className="mt-2 text-[15px] font-semibold" style={{ color: "#6B7280" }}>DSS Digital</div>

                    <div className="mt-3 flex items-center gap-2">
                      <a href="/dashboard/support" className="h-9 w-9 grid place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600" title="Support">🎧</a>
                      <a href="/faq" className="h-9 w-9 grid place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600" title="FAQ">❓</a>
                      <a href="/about" className="h-9 w-9 grid place-items-center rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600" title="Info">ℹ️</a>
                    </div>
                  </div>

                  {/* Mobile Banking label bar */}
                  <div
                    className="mt-5 w-full text-center text-white font-bold text-sm tracking-wide py-2.5"
                    style={{ background: "#1A56DB", borderRadius: "8px" }}
                  >
                    MOBILE BANKING
                  </div>

                  {/* 2×2 Grid */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {methods.length === 0 && (
                      <p className="col-span-2 text-center text-sm text-slate-500 py-6">কোনো পেমেন্ট মেথড সক্রিয় নেই</p>
                    )}
                    {methods.map((m) => {
                      const b = brandFor(m.name);
                      const logo = logoFor(m.name);
                      const color = b?.color ?? "#1A56DB";
                      const isSelected = methodId === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethodId(m.id)}
                          className="group grid place-items-center bg-white transition-all"
                          style={{
                            border: `${isSelected ? 2 : 1}px solid ${isSelected ? color : "#E5E7EB"}`,
                            borderRadius: "12px",
                            padding: "20px",
                            minHeight: "96px",
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.borderColor = color; }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.borderColor = "#E5E7EB"; }}
                        >
                          {logo ? (
                            <img src={logo} alt={b?.label ?? m.name} className="h-10 max-w-full object-contain" />
                          ) : (
                            <span className="font-display font-extrabold text-base" style={{ color }}>{b?.label ?? m.name}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============ STEP 2: AUTO / MANUAL CHOICE ============ */}
              {modalStep === "choice" && method && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-5">
                    <button onClick={() => { setModalStep("methods"); }} className="h-9 w-9 grid place-items-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700" aria-label="Back">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2">
                      {logoFor(method.name) && <img src={logoFor(method.name)!} alt="" className="h-7 w-7 object-contain" />}
                      <h2 className="font-display font-bold text-slate-900 text-base sm:text-lg">
                        {brand?.label ?? method.name} দিয়ে পেমেন্ট করুন
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowComingSoon(true)}
                      className="w-full flex items-center gap-3 rounded-[14px] p-4 text-left bg-white hover:bg-slate-50 transition"
                      style={{ border: `1px solid #E5E7EB`, borderLeft: `4px solid ${brand?.color ?? "#1A56DB"}` }}
                    >
                      <div className="h-11 w-11 shrink-0 rounded-full grid place-items-center" style={{ background: `${brand?.color ?? "#1A56DB"}22` }}>
                        <Zap className="h-5 w-5" style={{ color: brand?.color ?? "#1A56DB" }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-display font-extrabold text-[15px] text-slate-900">Automatic</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">তাৎক্ষণিক ভেরিফিকেশন</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => { setModalStep("manual"); setTrxError(false); }}
                      className="w-full flex items-center gap-3 rounded-[14px] p-4 text-left bg-white hover:bg-slate-50 transition"
                      style={{ border: `1px solid #E5E7EB`, borderLeft: `4px solid ${brand?.color ?? "#1A56DB"}` }}
                    >
                      <div className="h-11 w-11 shrink-0 rounded-full grid place-items-center" style={{ background: `${brand?.color ?? "#1A56DB"}22` }}>
                        <Hand className="h-5 w-5" style={{ color: brand?.color ?? "#1A56DB" }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-display font-extrabold text-[15px] text-slate-900">Manual</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">নিজে Transaction ID দিন</div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============ STEP 3: MANUAL PAYMENT FORM ============ */}
              {modalStep === "manual" && method && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setModalStep("choice")} className="h-9 w-9 grid place-items-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700" aria-label="Back">
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {logoFor(method.name) && <img src={logoFor(method.name)!} alt="" className="h-8 w-8 object-contain" />}
                      <div className="min-w-0">
                        <div className="font-display font-extrabold text-slate-900 text-base leading-tight">{brand?.label ?? method.name} Manual</div>
                      </div>
                    </div>
                  </div>

                  <input
                    value={trxId}
                    onChange={(e) => { setTrxId(e.target.value); if (trxError) setTrxError(false); }}
                    placeholder="Enter Transaction ID"
                    className={`w-full bg-white text-slate-900 placeholder:text-slate-400 px-4 py-3 text-sm font-semibold outline-none transition ${trxError ? "ring-2 ring-red-500" : "focus:ring-2 focus:ring-slate-300"}`}
                    style={{ border: `1px solid ${trxError ? "#EF4444" : "#DDDDDD"}`, borderRadius: "10px" }}
                  />
                  {trxError && <div className="mt-1.5 text-[11px] font-semibold text-red-600">Transaction ID দিন</div>}

                  <div
                    className="mt-4 rounded-2xl p-5 text-white"
                    style={{ background: brand?.color ?? "#1A56DB" }}
                  >
                    <ul className="space-y-3 text-sm leading-relaxed">
                      {instructionLines.length > 0 ? (
                        instructionLines.map((line, i) => (
                          <li key={i} className="flex gap-2.5">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                            <span dangerouslySetInnerHTML={{ __html: highlightInstruction(line) }} />
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" /><span>Open your <b style={{ color: "#FFD700" }}>{brand?.label ?? method.name}</b> app</span></li>
                          <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" /><span>Choose: <b style={{ color: "#FFD700" }}>"Payment"</b></span></li>
                        </>
                      )}
                      <li className="flex flex-wrap gap-2 items-center">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                        <span>Receiver Number:</span>
                        <span className="font-display font-extrabold" style={{ color: "#FFD700" }}>{method.account_number || "—"}</span>
                        <button onClick={copyNumber} className="inline-flex items-center gap-1 rounded-md bg-black/25 hover:bg-black/40 px-2 py-1 text-[11px] font-bold text-white">
                          <Copy className="h-3 w-3" /> {copied ? "Copied!" : "Copy"}
                        </button>
                      </li>
                      <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" /><span>Amount: <b style={{ color: "#FFD700" }}>৳{Math.round(total)}</b></span></li>
                      <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" /><span>Enter PIN to confirm.</span></li>
                      <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" /><span>You will receive a confirmation SMS.</span></li>
                      <li className="flex gap-2.5"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" /><span>Put <b style={{ color: "#FFD700" }}>Transaction ID</b> in the box above and press <b style={{ color: "#FFD700" }}>VERIFY</b></span></li>
                    </ul>
                  </div>

                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="mt-4 w-full py-[18px] text-base font-extrabold text-white tracking-wide inline-flex items-center justify-center gap-2 disabled:opacity-60 transition hover:brightness-110"
                    style={{ background: brand?.color ?? "#1A56DB", borderRadius: "14px" }}
                  >
                    {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null} VERIFY
                  </button>
                </div>
              )}
            </div>

            {/* ---------- Fixed bottom bar (Step 1 only) ---------- */}
            {modalStep === "methods" && (
              <div
                className="shrink-0 px-5 py-4"
                style={{ borderTop: "1px solid #E5E7EB", background: "#FFFFFF" }}
              >
                <button
                  onClick={() => {
                    if (!methodId) { toast.error("একটি পেমেন্ট মেথড বেছে নিন"); return; }
                    setModalStep("choice");
                  }}
                  className="w-full text-center font-display font-bold transition hover:brightness-95"
                  style={{ color: "#1A56DB", fontSize: "20px" }}
                >
                  Pay ৳{Math.round(total)} BDT
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= COMING SOON POPUP ================= */}
      {showComingSoon && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-fade-in" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setShowComingSoon(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[380px] rounded-[20px] p-6 text-center animate-scale-in border border-white/10" style={{ background: "rgba(13,13,26,0.98)" }}>
            <div className="mx-auto h-14 w-14 grid place-items-center rounded-full mb-3" style={{ background: "rgba(255,107,53,0.15)" }}>
              <AlertTriangle className="h-7 w-7" style={{ color: "#FF6B35" }} />
            </div>
            <h3 className="font-display font-bold text-lg text-white">Coming Soon</h3>
            <p className="mt-2 text-sm text-white/70">This payment method is not available yet. Please try another payment method.</p>
            <button onClick={() => setShowComingSoon(false)} className="mt-5 w-full rounded-xl px-5 py-2.5 text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, #FF6B35, #7B2FBE)" }}>ঠিক আছে</button>
          </div>
        </div>
      )}

      {/* ================= SUCCESS POPUP ================= */}
      {successOrderId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-[420px] rounded-[20px] p-6 text-center animate-scale-in border border-white/10" style={{ background: "rgba(13,13,26,0.98)" }}>
            <div className="mx-auto h-16 w-16 grid place-items-center rounded-full mb-3" style={{ background: "rgba(34,197,94,0.15)" }}>
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
            </div>
            <h3 className="font-display font-bold text-xl text-white">অর্ডার জমা হয়েছে!</h3>
            <p className="mt-2 text-xs text-white/60">অর্ডার ID</p>
            <div className="font-mono font-bold text-white text-sm">#{successOrderId}</div>
            <p className="mt-3 text-sm text-white/75">পেমেন্ট যাচাই হলে ১-২ ঘণ্টার মধ্যে ডেলিভারি পাবেন।</p>
            <button onClick={() => { setSuccessOrderId(null); nav({ to: "/dashboard/orders" }); }} className="mt-5 w-full rounded-xl px-5 py-3 text-sm font-bold text-white inline-flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #FF6B35, #7B2FBE)" }}>
              <Package className="h-4 w-4" /> আমার অর্ডার দেখুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
function highlightInstruction(line: string): string {
  const esc = escapeHtml(line);
  // Highlight quoted strings, digit-only numbers (>=3 digits), and words like Transaction ID / VERIFY / Payment
  return esc
    .replace(/&quot;([^&]+?)&quot;/g, '<b style="color:#FFD700">"$1"</b>')
    .replace(/\b(VERIFY|Transaction ID|Payment|Send Money|Cash In)\b/g, '<b style="color:#FFD700">$1</b>')
    .replace(/(?<![\w#])(\d{3,})(?![\w])/g, '<b style="color:#FFD700">$1</b>');
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={accent ? "text-primary font-semibold" : "font-semibold"}>{value}</span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", id, error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; id?: string; error?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${error ? "border-2 border-destructive ring-2 ring-destructive/30" : ""}`}
      />
    </div>
  );
}
