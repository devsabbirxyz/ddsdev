import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Tag, Loader2, Copy, Wallet, CreditCard, Minus, Plus, Trash2 } from "lucide-react";
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

const METHOD_BRAND: Record<string, { label: string; color: string }> = {
  bkash: { label: "bKash", color: "#E2136E" },
  nagad: { label: "Nagad", color: "#F37021" },
  rocket: { label: "Rocket", color: "#8C3494" },
  upay: { label: "Upay", color: "#FFCB05" },
};
function brandFor(name?: string | null) {
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
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const method = methods.find((m) => m.id === methodId);
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
    setShowPayment(true);
    setTimeout(() => paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 320);
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
    if (!validateInfo()) return;
    if (!methodId || !method) { toast.error("পেমেন্ট মেথড সিলেক্ট করুন"); return; }
    if (!trxId.trim()) { toast.error("Transaction ID দিন"); return; }

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
      clear();
      toast.success("✅ অর্ডার সফলভাবে জমা হয়েছে!");
      setTimeout(() => nav({ to: "/dashboard/orders" }), 800);
    } catch (e: any) {
      console.error("Order create failed:", e);
      toast.error(e?.message ?? "অর্ডার তৈরি ব্যর্থ");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="font-display font-bold text-2xl">কার্ট খালি</h1>
        <Link to="/shop" className="mt-4 inline-block rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">শপে যান</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="font-display font-bold text-2xl sm:text-3xl mb-6">চেকআউট</h1>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* ============ LEFT: Order + Coupon ============ */}
        <div className="space-y-5">
          {/* Order Summary */}
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
                          <button
                            onClick={() => updateQty(it.productId, it.quantity - 1, it.variantId)}
                            className="grid h-7 w-7 place-items-center rounded-md hover:bg-accent disabled:opacity-40"
                            disabled={it.quantity <= 1}
                            aria-label="কমান"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold min-w-6 text-center">{it.quantity}</span>
                          <button
                            onClick={() => updateQty(it.productId, it.quantity + 1, it.variantId)}
                            className="grid h-7 w-7 place-items-center rounded-md hover:bg-accent"
                            aria-label="বাড়ান"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="font-display font-bold text-sm text-gradient-brand">
                        {formatBDT(it.price * it.quantity)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(it.productId, it.variantId)}
                    className="rounded-lg p-1.5 hover:bg-accent text-muted-foreground hover:text-destructive transition"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Coupon */}
          <section className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-3 inline-flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" /> কুপন কোড
            </h2>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="কুপন কোড লিখুন"
                className="flex-1 rounded-xl glass px-4 py-2.5 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                onClick={applyCoupon}
                className="rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition"
              >
                প্রয়োগ
              </button>
            </div>
            {couponMsg && (
              <div className={`mt-2 text-xs font-semibold ${couponMsg.ok ? "text-primary" : "text-destructive"}`}>
                {couponMsg.text}
              </div>
            )}
          </section>

          {/* Wallet (optional) */}
          {walletBalance > 0 && (
            <section className="glass-card rounded-2xl p-5">
              <h2 className="font-display font-bold text-lg mb-3 inline-flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" /> ওয়ালেট পয়েন্ট
                <span className="text-xs text-muted-foreground font-normal">(ব্যালেন্স: {walletBalance})</span>
              </h2>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={maxRedeem}
                  value={redeemPoints || ""}
                  onChange={(e) => setRedeemPoints(Math.max(0, Math.min(maxRedeem, Number(e.target.value) || 0)))}
                  placeholder="0"
                  className="flex-1 rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={() => setRedeemPoints(maxRedeem)}
                  className="rounded-xl glass px-4 py-2.5 text-xs font-semibold hover:bg-accent"
                >
                  সর্বোচ্চ
                </button>
              </div>
              {safeRedeem > 0 && (
                <div className="mt-2 text-xs text-primary inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> − {formatBDT(safeRedeem)} (1 পয়েন্ট = 1৳)
                </div>
              )}
            </section>
          )}
        </div>

        {/* ============ RIGHT: Customer Info + Price + Pay Now ============ */}
        <aside className="space-y-5 lg:sticky lg:top-24 h-fit">
          <section className="glass-card rounded-2xl p-5">
            <h2 className="font-display font-bold text-lg mb-4">কাস্টমার তথ্য</h2>
            <div className="space-y-3">
              <Field id="field-name" label="পূর্ণ নাম *" value={name} onChange={(v) => { setName(v); if (errors.name) setErrors({ ...errors, name: false }); }} placeholder="Md. Sabbir" error={!!errors.name} />
              <Field id="field-phone" label="ফোন নম্বর *" value={phone} onChange={(v) => { setPhone(v); if (errors.phone) setErrors({ ...errors, phone: false }); }} placeholder="01XXXXXXXXX" error={!!errors.phone} />
              <Field id="field-email" label="ইমেইল *" value={email} onChange={(v) => { setEmail(v); if (errors.email) setErrors({ ...errors, email: false }); }} placeholder="you@example.com" type="email" error={!!errors.email} />
              <div>
                <label className="text-xs font-semibold mb-1.5 block">প্রোডাক্টের জন্য তথ্য (ইমেইল/ইউজারনেম) — ঐচ্ছিক</label>
                <textarea
                  id="field-customerInput"
                  value={customerInput}
                  onChange={(e) => setCustomerInput(e.target.value)}
                  rows={2}
                  placeholder="যেকোনো অতিরিক্ত তথ্য"
                  className="w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
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

            <button
              onClick={handlePayNow}
              disabled={showPayment}
              className="mt-4 w-full rounded-2xl bg-gradient-brand px-6 py-3.5 text-base font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
            >
              <CreditCard className="h-5 w-5" /> {showPayment ? "নিচে পেমেন্ট সিলেক্ট করুন" : "এখনই পেমেন্ট করুন"}
            </button>
            <p className="mt-2 text-[11px] text-center text-muted-foreground">অ্যাডমিন verify করার পর ডেলিভারি হবে।</p>
          </section>
        </aside>
      </div>

      {/* ============ Payment Section (expand on Pay Now) ============ */}
      <div
        ref={paymentSectionRef}
        style={{ maxHeight: showPayment ? 3000 : 0 }}
        className="overflow-hidden transition-[max-height] duration-500 ease-out"
      >
        <section className="glass-card rounded-2xl p-5 sm:p-6 mt-6">
          <div className="text-center mb-5">
            <h2 className="font-display font-bold text-xl sm:text-2xl">পেমেন্ট মেথড সিলেক্ট করুন</h2>
            <p className="text-xs text-muted-foreground mt-1">যেকোনো একটি মোবাইল ব্যাংকিং বেছে নিন</p>
          </div>

          {methods.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">কোনো পেমেন্ট মেথড সেটআপ করা হয়নি।</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {methods.map((m) => {
                const logo = logoFor(m.name);
                const brand = brandFor(m.name);
                const active = methodId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setMethodId(m.id); setTrxId(""); }}
                    className={`relative rounded-2xl p-4 transition-all duration-200 backdrop-blur-xl bg-white/95 hover:bg-white shadow-lg hover:-translate-y-0.5 ${
                      active
                        ? "ring-2 ring-primary shadow-glow scale-[1.02]"
                        : "border border-white/30"
                    }`}
                  >
                    <div className="aspect-[5/3] grid place-items-center">
                      {logo ? (
                        <img src={logo} alt={brand?.label ?? m.name} loading="lazy" className="max-h-14 sm:max-h-16 w-auto object-contain" />
                      ) : (
                        <span className="font-display font-extrabold text-xl" style={{ color: brand?.color ?? "#111" }}>
                          {brand?.label ?? m.name}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-black/60 mt-1">
                      {m.account_type || "Personal"}
                    </div>
                    {active && (
                      <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary grid place-items-center shadow-glow">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Payment Form */}
          {method && (
            <div className="mt-6 rounded-2xl glass p-5 animate-fade-in max-w-xl mx-auto">
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">পাঠান এই নম্বরে:</div>
                  <div className="flex items-center gap-2 rounded-xl bg-background/60 border border-border px-4 py-3">
                    <span className="text-lg">📱</span>
                    <span className="font-display font-extrabold text-lg tracking-wide flex-1">
                      {method.account_number || "—"}
                    </span>
                    <button
                      onClick={copyNumber}
                      className="inline-flex items-center gap-1 rounded-lg bg-gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow hover:scale-105 transition"
                    >
                      <Copy className="h-3 w-3" /> {copied ? "✅ কপি হয়েছে!" : "কপি করুন"}
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Type: <span className="font-semibold text-foreground">{method.account_type || "Personal"}</span>
                    <span className="mx-2">·</span>
                    পরিমাণ: <span className="font-display font-bold text-primary">{formatBDT(total)}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Transaction ID *</label>
                  <input
                    value={trxId}
                    onChange={(e) => setTrxId(e.target.value)}
                    placeholder="TRXID লিখুন"
                    className="w-full rounded-xl glass px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full rounded-2xl bg-gradient-brand px-6 py-3.5 text-base font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:scale-100"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  অর্ডার কনফার্ম করুন
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
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
