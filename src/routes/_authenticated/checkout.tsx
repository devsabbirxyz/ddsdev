import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Tag, Loader2, Copy, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatBDT } from "@/lib/storefront";
import { siteSettingsQuery } from "@/lib/site-settings";
import { notify } from "@/lib/telegram-notify";
import { placeOrder } from "@/lib/orders.functions";
import { walletQuery } from "@/lib/wallet";
import { Wallet } from "lucide-react";
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

// Brand color wordmark per method (matched by lowercased name)
const METHOD_BRAND: Record<string, { label: string; color: string }> = {
  bkash:  { label: "bKash",  color: "#E2136E" },
  nagad:  { label: "Nagad",  color: "#EC1C24" },
  rocket: { label: "Rocket", color: "#8C3494" },
  upay:   { label: "Upay",   color: "#E5B700" },
};
function brandFor(name?: string | null) {
  if (!name) return null;
  const k = name.toLowerCase().replace(/\s+/g, "");
  for (const key of Object.keys(METHOD_BRAND)) if (k.includes(key)) return METHOD_BRAND[key];
  return null;
}

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "চেকআউট — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, clear } = useCart();
  const nav = useNavigate();
  const { data: methods = [] } = useQuery(paymentMethodsQuery);

  const { data: wallet } = useQuery({ ...walletQuery(), enabled: !!user });
  const walletBalance = wallet?.balance ?? 0;

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [customerInput, setCustomerInput] = useState("");
  const [methodId, setMethodId] = useState<string>("");
  const [trxId, setTrxId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [redeemPoints, setRedeemPoints] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

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
        if (!firstInvalid) {
          firstInvalid = f.key;
          firstLabel = f.label;
          formatBadFirst = formatBad;
        }
      }
    }
    setErrors(newErrors);
    if (firstInvalid) {
      toast.error(
        formatBadFirst ? `⚠️ সঠিক ${firstLabel} দিন!` : `⚠️ অনুগ্রহ করে ${firstLabel} পূরণ করুন!`,
        { position: "bottom-center" }
      );
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

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const { data, error } = await supabase
      .from("coupons")
      .select("code,discount_type,discount_value,minimum_order,is_active,start_date,end_date")
      .ilike("code", code)
      .maybeSingle();
    if (error || !data) { toast.error("কুপন কোড পাওয়া যায়নি"); return; }
    if (!data.is_active) { toast.error("কুপন সক্রিয় নয়"); return; }
    const now = new Date();
    if (data.start_date && new Date(data.start_date) > now) { toast.error("কুপন এখনো সক্রিয় হয়নি"); return; }
    if (data.end_date && new Date(data.end_date) < now) { toast.error("কুপন মেয়াদ শেষ"); return; }
    if (subtotal < Number(data.minimum_order ?? 0)) { toast.error(`নূন্যতম অর্ডার ${formatBDT(data.minimum_order)}`); return; }
    const isPercent = data.discount_type === "percentage" || data.discount_type === "percent";
    const disc = isPercent
      ? Math.round((subtotal * Number(data.discount_value)) / 100)
      : Number(data.discount_value);
    setCoupon({ code: data.code, discount: Math.min(disc, subtotal) });
    toast.success(`কুপন অ্যাপ্লাই হয়েছে — ছাড় ${formatBDT(disc)}`);
  };

  const goToPayment = () => {
    if (items.length === 0) { toast.error("কার্ট খালি"); return; }
    if (!validateInfo()) return;
    setStep(2);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!user) { toast.error("লগইন করুন"); return; }
    if (items.length === 0) { toast.error("কার্ট খালি"); return; }
    if (!validateInfo()) { setStep(1); return; }
    if (!methodId || !method) { toast.error("পেমেন্ট মেথড সিলেক্ট করুন"); return; }
    


    setSubmitting(true);
    try {
      const result = await placeOrder({
        data: {
          items: items.map((it) => ({
            productId: it.productId,
            variantId: it.variantId ?? null,
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

      // Fire Telegram notifications (fire-and-forget)
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
      toast.success("✅ আপনার অর্ডার সফলভাবে জমা হয়েছে!", {
        duration: 3500,
        className: "!bg-green-600 !text-white !border-green-700",
      });
      nav({ to: "/dashboard/orders" });
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

  // ===== STEP 2: Payment Method Selection =====
  if (step === 2) {
    return <PaymentSelect
      methods={methods}
      methodId={methodId}
      setMethodId={setMethodId}
      trxId={trxId}
      setTrxId={setTrxId}
      total={total}
      submitting={submitting}
      onBack={() => setStep(1)}
      onSubmit={submit}
    />;
  }

  // ===== STEP 1: Info + sidebar =====
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-3xl">চেকআউট</h1>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-full font-semibold bg-gradient-brand text-primary-foreground shadow-glow">১. তথ্য</span>
          <span className="text-muted-foreground">→</span>
          <span className="px-3 py-1.5 rounded-full font-semibold glass text-muted-foreground">২. পেমেন্ট</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-card rounded-2xl p-6">
            <h2 className="font-display font-bold text-lg mb-4">আপনার তথ্য</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field id="field-name" label="পূর্ণ নাম *" value={name} onChange={(v) => { setName(v); if (errors.name) setErrors({ ...errors, name: false }); }} placeholder="Md. Sabbir" error={!!errors.name} />
              <Field id="field-phone" label="ফোন নম্বর *" value={phone} onChange={(v) => { setPhone(v); if (errors.phone) setErrors({ ...errors, phone: false }); }} placeholder="01XXXXXXXXX" error={!!errors.phone} />
              <div className="sm:col-span-2"><Field id="field-email" label="ইমেইল *" value={email} onChange={(v) => { setEmail(v); if (errors.email) setErrors({ ...errors, email: false }); }} placeholder="you@example.com" type="email" error={!!errors.email} /></div>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold mb-1.5 block">প্রোডাক্টের জন্য তথ্য (যেমন ইমেইল/ইউজারনেম) — ঐচ্ছিক</label>
                <textarea id="field-customerInput" value={customerInput} onChange={(e) => { setCustomerInput(e.target.value); if (errors.customerInput) setErrors({ ...errors, customerInput: false }); }} rows={2} placeholder="যেকোনো অতিরিক্ত তথ্য" className={`w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${errors.customerInput ? "border-2 border-destructive ring-2 ring-destructive/30" : ""}`} />
              </div>
            </div>
          </section>
        </div>

        <aside className="glass-card rounded-2xl p-6 h-fit lg:sticky lg:top-24 space-y-4">
          <h2 className="font-display font-bold text-lg">অর্ডার সারমর্ম</h2>
          <div className="space-y-2 text-sm max-h-56 overflow-auto">
            {items.map((it) => (
              <div key={`${it.productId}-${it.variantId ?? ""}`} className="flex justify-between gap-2">
                <span className="line-clamp-1 text-muted-foreground">{it.title} × {it.quantity}</span>
                <span className="font-semibold shrink-0">{formatBDT(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold mb-1.5 block">কুপন কোড</label>
            <div className="flex gap-2">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="DDS10" className="flex-1 rounded-xl glass px-3 py-2 text-sm uppercase outline-none focus:ring-2 focus:ring-primary/40" />
              <button onClick={applyCoupon} className="rounded-xl glass px-3 py-2 text-xs font-semibold hover:bg-accent inline-flex items-center gap-1"><Tag className="h-3 w-3" /> অ্যাপ্লাই</button>
            </div>
            {coupon && <div className="mt-2 text-xs text-primary inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {coupon.code} — {formatBDT(coupon.discount)}</div>}
          </div>

          <div className="border-t border-border pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span>{formatBDT(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-primary"><span>ছাড়</span><span>− {formatBDT(discount)}</span></div>}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-bold">মোট</span>
              <span className="font-display font-bold text-xl text-gradient-brand">{formatBDT(total)}</span>
            </div>
          </div>

          <button onClick={goToPayment} className="w-full rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition">
            পেমেন্টে এগিয়ে যান →
          </button>
          <p className="text-[11px] text-center text-muted-foreground">অ্যাডমিন verify করার পর প্রোডাক্ট deliver হবে।</p>
        </aside>
      </div>
    </div>
  );
}

type PaymentMethod = {
  id: string;
  name: string;
  account_number: string | null;
  instructions: string | null;
  is_manual_active: boolean | null;
  is_automatic_active: boolean | null;
  has_automatic: boolean | null;
};

// Method theme: brand color box + Bengali app/USSD line for step 1
const METHOD_THEME: Record<string, { app: string; ussd: string | null; bg: string; btn: string; textOnBox: string; ring: string }> = {
  bkash:  { app: "bKash",  ussd: "*247#", bg: "#E2136E", btn: "#E2136E", textOnBox: "#ffffff", ring: "#E2136E" },
  nagad:  { app: "Nagad",  ussd: "*167#", bg: "#F37021", btn: "#F37021", textOnBox: "#ffffff", ring: "#F37021" },
  rocket: { app: "Rocket", ussd: "*322#", bg: "#8C3494", btn: "#8C3494", textOnBox: "#ffffff", ring: "#8C3494" },
  upay:   { app: "Upay",   ussd: null,    bg: "#FFCB05", btn: "#111111", textOnBox: "#111111", ring: "#FFCB05" },
};
function themeFor(name?: string | null) {
  if (!name) return null;
  const k = name.toLowerCase().replace(/\s+/g, "");
  for (const key of Object.keys(METHOD_THEME)) if (k.includes(key)) return METHOD_THEME[key];
  return null;
}

function PaymentSelect({
  methods, methodId, setMethodId, trxId, setTrxId, total, submitting, onBack, onSubmit,
}: {
  methods: PaymentMethod[];
  methodId: string;
  setMethodId: (id: string) => void;
  trxId: string;
  setTrxId: (v: string) => void;
  total: number;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const [payTab, setPayTab] = useState<"automatic" | "manual">("automatic");
  const { data: settings } = useQuery(siteSettingsQuery);
  const logoUrl = settings?.site_logo_url;
  const siteName = settings?.site_name || "DDS-Digital";

  const selectedMethod = methods.find((m) => m.id === methodId);

  // ===== Payment Instructions Screen =====
  if (selectedMethod) {
    const theme = themeFor(selectedMethod.name);
    const brand = brandFor(selectedMethod.name);
    const adminNumber = selectedMethod.account_number || "—";
    const appName = theme?.app ?? brand?.label ?? selectedMethod.name;
    const ussd = theme?.ussd;
    const boxBg = theme?.bg ?? "#111";
    const textColor = theme?.textOnBox ?? "#fff";
    const btnBg = theme?.btn ?? "#111";

    const copyNumber = async () => {
      try {
        await navigator.clipboard.writeText(adminNumber);
        toast.success("নম্বর কপি হয়েছে");
      } catch {
        toast.error("কপি করা যায়নি");
      }
    };

    const handleVerify = () => {
      if (!trxId.trim()) {
        toast.error("⚠️ ট্রানজেকশন আইডি দিন!");
        return;
      }
      onSubmit();
    };

    return (
      <div className="relative min-h-[calc(100vh-4rem)]" style={{ backgroundColor: boxBg }}>
        <div className="mx-auto max-w-xl px-4 sm:px-6 pt-6 pb-32" style={{ color: textColor }}>
          <button
            type="button"
            onClick={() => { setMethodId(""); setTrxId(""); setPayTab("automatic"); }}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm px-3.5 py-2 text-xs sm:text-sm font-bold mb-6 border border-white/30 transition"
            style={{ color: textColor }}
          >
            <ArrowLeft className="h-4 w-4" /> পেমেন্ট মেথড পরিবর্তন করুন
          </button>

          <div className="text-center mb-6">
            <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-2xl bg-white shadow-lg px-4 py-3">
              {logoFor(selectedMethod.name) ? (
                <img
                  src={logoFor(selectedMethod.name)!}
                  alt={appName}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <span className="font-display font-extrabold text-xl" style={{ color: btnBg }}>{appName}</span>
              )}
            </div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl">ট্রানজেকশন আইডি দিন</h1>
            <p className="text-sm opacity-90 mt-1">{appName} পেমেন্ট</p>
          </div>

          {/* Automatic / Manual tabs */}
          <div className="grid grid-cols-2 gap-2 mb-5 rounded-2xl bg-white/15 p-1 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setPayTab("automatic")}
              className={`rounded-xl py-2.5 text-sm font-bold transition ${payTab === "automatic" ? "bg-white shadow-md" : "opacity-80 hover:opacity-100"}`}
              style={payTab === "automatic" ? { color: btnBg } : { color: textColor }}
            >
              Automatic
            </button>
            <button
              type="button"
              onClick={() => setPayTab("manual")}
              className={`rounded-xl py-2.5 text-sm font-bold transition ${payTab === "manual" ? "bg-white shadow-md" : "opacity-80 hover:opacity-100"}`}
              style={payTab === "manual" ? { color: btnBg } : { color: textColor }}
            >
              Manual
            </button>
          </div>

          {payTab === "automatic" ? (
            selectedMethod.has_automatic && selectedMethod.is_automatic_active ? (
              <div className="rounded-2xl bg-white/95 text-black p-6 space-y-4 shadow-lg">
                <p className="text-sm font-semibold">
                  নিচের বাটনে চাপলে {appName} এর Automatic পেমেন্ট গেটওয়ে চালু হবে।
                </p>
                <button
                  type="button"
                  onClick={() => toast.info("Automatic gateway শীঘ্রই যুক্ত হবে")}
                  className="w-full rounded-xl px-6 py-3 text-base font-extrabold text-white shadow-lg hover:scale-[1.01] transition"
                  style={{ backgroundColor: btnBg }}
                >
                  Pay {Math.round(total)} BDT — {appName}
                </button>
                <p className="text-xs text-black/60 text-center">
                  সমস্যা হলে উপরে Manual tab এ যান।
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-black/60 text-white p-6 text-center shadow-lg">
                <p className="text-base font-bold">এই মুহূর্তে Automatic পেমেন্ট Available নেই</p>
                <p className="text-xs opacity-80 mt-2">অনুগ্রহ করে উপরে Manual tab বেছে নিন।</p>
              </div>
            )
          ) : (
            <>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="ট্রানজেকশন আইডি লিখুন"
                className="w-full rounded-2xl bg-white text-black px-5 py-4 text-base font-semibold outline-none focus:ring-4 focus:ring-white/40 placeholder:text-black/40 shadow-lg"
              />

              <ol className="mt-6 space-y-3 text-sm sm:text-base">
                <Step n={1}>
                  {appName} অ্যাপ খুলুন{ussd ? <> অথবা <span className="font-bold">{ussd}</span> ডায়াল করুন</> : null}
                </Step>
                <Step n={2}>"Send Money" সিলেক্ট করুন</Step>
                <Step n={3}>
                  নম্বরটি দিন:{" "}
                  <span className="font-bold">{adminNumber}</span>
                  <button
                    type="button"
                    onClick={copyNumber}
                    className="ml-2 inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold hover:bg-white/30 align-middle"
                  >
                    <Copy className="h-3 w-3" /> কপি
                  </button>
                </Step>
                <Step n={4}>
                  পরিমাণ দিন: <span className="font-bold">{formatBDT(total)}</span>
                </Step>
                <Step n={5}>Reference এ আপনার নাম লিখুন</Step>
                <Step n={6}>PIN দিয়ে confirm করুন</Step>
                <Step n={7}>Confirmation SMS পেলে Transaction ID উপরের বক্সে দিন</Step>
              </ol>

              <button
                type="button"
                onClick={handleVerify}
                disabled={submitting}
                className="mt-8 w-full rounded-2xl px-6 py-4 text-base font-extrabold shadow-2xl hover:scale-[1.01] transition disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center justify-center gap-2 bg-white"
                style={{ color: btnBg }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                যাচাই করুন
              </button>
            </>
          )}

        </div>

        {/* Fixed bottom Pay bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-white/20 backdrop-blur-md" style={{ backgroundColor: `${boxBg}E6` }}>
          <div className="mx-auto max-w-xl px-4 sm:px-6 py-3 flex items-center justify-between" style={{ color: textColor }}>
            <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Total</span>
            <span className="font-display font-extrabold text-2xl">
              Pay {Math.round(total)} BDT
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ===== Method Picker Grid =====
  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-gradient-glow">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 pt-10 pb-32">
        {/* Logo + name */}
        <div className="flex flex-col items-center gap-3 mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-14 w-auto max-w-[180px] object-contain" />
          ) : (
            <div className="h-14 w-14 rounded-2xl bg-gradient-brand grid place-items-center shadow-glow">
              <span className="text-primary-foreground font-display font-bold text-xl">
                {siteName.charAt(0)}
              </span>
            </div>
          )}
          <h1 className="font-display font-bold text-2xl tracking-tight">{siteName}</h1>
        </div>

        {/* Section header */}
        <div className="text-center mb-6">
          <h2 className="font-display font-bold text-xl">মোবাইল ব্যাংকিং</h2>
          <p className="text-xs text-muted-foreground mt-1">পেমেন্ট মেথড সিলেক্ট করুন</p>
        </div>

        {/* 2x2 method grid */}
        {methods.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">কোনো পেমেন্ট মেথড সেটআপ করা হয়নি।</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {methods.map((m) => {
              const logo = logoFor(m.name);
              const brand = brandFor(m.name);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodId(m.id)}
                  className="relative rounded-3xl p-6 transition-all duration-200 backdrop-blur-xl border border-white/40 bg-white/95 hover:bg-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  <div className="aspect-[5/3] grid place-items-center">
                    {logo ? (
                      <img
                        src={logo}
                        alt={brand?.label ?? m.name}
                        loading="lazy"
                        width={512}
                        height={512}
                        className="max-h-20 sm:max-h-24 w-auto object-contain"
                      />
                    ) : (
                      <span
                        className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight"
                        style={{ color: brand?.color ?? "#111" }}
                      >
                        {brand?.label ?? m.name}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            ← তথ্য এডিট করুন
          </button>
        </div>
      </div>

      {/* Fixed bottom Pay bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-glass-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total</span>
          <span className="font-display font-extrabold text-2xl text-gradient-brand">
            Pay {Math.round(total)} BDT
          </span>
        </div>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 h-7 w-7 rounded-full bg-white/25 grid place-items-center font-bold text-sm">
        {n}
      </span>
      <span className="pt-0.5 leading-relaxed">{children}</span>
    </li>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", id, error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; id?: string; error?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block">{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${error ? "border-2 border-destructive ring-2 ring-destructive/30" : ""}`} />
    </div>
  );
}
