import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Tag, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatBDT } from "@/lib/storefront";
import { siteSettingsQuery } from "@/lib/site-settings";

const paymentMethodsQuery = queryOptions({
  queryKey: ["payment_methods", "active"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("id,name,name_en,account_type,send_type,account_number,instructions,is_manual_active,is_automatic_active,has_automatic,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).filter((m) => m.is_manual_active || m.is_automatic_active);
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

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [customerInput, setCustomerInput] = useState("");
  const [methodId, setMethodId] = useState<string>("");
  const [trxId, setTrxId] = useState("");
  const [paymentTab, setPaymentTab] = useState<"automatic" | "manual">("manual");
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validateInfo = (): boolean => {
    const defs = [
      { key: "name", label: "পূর্ণ নাম", value: name },
      { key: "phone", label: "ফোন নম্বর", value: phone },
      { key: "email", label: "ইমেইল", value: email, validate: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) },
      { key: "customerInput", label: "প্রোডাক্টের জন্য তথ্য", value: customerInput },
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
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const { data, error } = await supabase
      .from("coupons")
      .select("code,discount_type,discount_value,minimum_order,is_active,start_date,end_date,max_uses,used_count")
      .ilike("code", code)
      .maybeSingle();
    if (error || !data) { toast.error("কুপন কোড পাওয়া যায়নি"); return; }
    if (!data.is_active) { toast.error("কুপন সক্রিয় নয়"); return; }
    const now = new Date();
    if (data.start_date && new Date(data.start_date) > now) { toast.error("কুপন এখনো সক্রিয় হয়নি"); return; }
    if (data.end_date && new Date(data.end_date) < now) { toast.error("কুপন মেয়াদ শেষ"); return; }
    if (data.max_uses && (data.used_count ?? 0) >= data.max_uses) { toast.error("কুপন সীমা শেষ"); return; }
    if (subtotal < Number(data.minimum_order ?? 0)) { toast.error(`নূন্যতম অর্ডার ${formatBDT(data.minimum_order)}`); return; }
    const disc = data.discount_type === "percent"
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
    // Validate product IDs still exist (cart may have stale/deleted products)
    const productIds = Array.from(new Set(items.map((i) => i.productId)));
    const { data: existing, error: vErr } = await supabase
      .from("products").select("id").in("id", productIds);
    if (vErr) { setSubmitting(false); toast.error(vErr.message); return; }
    const validIds = new Set((existing ?? []).map((p) => p.id));
    const validItems = items.filter((i) => validIds.has(i.productId));
    if (validItems.length === 0) {
      setSubmitting(false);
      clear();
      toast.error("কার্টের প্রোডাক্টগুলো আর পাওয়া যাচ্ছে না — নতুন করে অর্ডার করুন");
      nav({ to: "/shop" });
      return;
    }
    if (validItems.length !== items.length) {
      toast.warning("কিছু প্রোডাক্ট আর পাওয়া যাচ্ছে না — বাকিগুলো অর্ডার হচ্ছে");
    }
    try {
      const orderNumber = `DDS-${Date.now().toString(36).toUpperCase()}`;
      const perItemDiscount = validItems.length > 0 ? Math.floor(discount / validItems.length) : 0;
      const rows = validItems.map((it, idx) => ({
        order_number: idx === 0 ? orderNumber : `${orderNumber}-${idx + 1}`,
        user_id: user.id,
        product_id: it.productId,
        variant_id: it.variantId ?? null,
        product_title: it.title,
        variant_label: it.variantLabel ?? null,
        quantity: it.quantity,
        regular_price: it.price,
        offer_price: it.price,
        total_price: Math.max(0, it.price * it.quantity - perItemDiscount),
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: phone.trim(),
        customer_input: customerInput.trim() || null,
        payment_method: method.name,
        payment_type: method.is_manual_active ? "manual" : "automatic",
        transaction_id: trxId.trim() || null,
        coupon_code: coupon?.code ?? null,
        discount_amount: perItemDiscount,
        status: "pending",
        delivery_status: "pending",
      }));
      const { data, error } = await supabase.from("orders").insert(rows).select("id,order_number").limit(1);
      if (error) throw error;
      const firstOrderId = data?.[0]?.id ?? null;
      clear();
      setSuccessOrderId(firstOrderId);
      setSuccessOpen(true);
      toast.success("✅ অর্ডার সফল হয়েছে!", {
        duration: 3000,
        className: "!bg-green-600 !text-white !border-green-700",
      });
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
                <label className="text-xs font-semibold mb-1.5 block">প্রোডাক্টের জন্য তথ্য (যেমন ইমেইল/ইউজারনেম) *</label>
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
  is_manual_active: boolean;
  is_automatic_active: boolean;
  has_automatic: boolean;
};

function PaymentSelect({
  methods, methodId, setMethodId, total, submitting, onBack, onSubmit,
}: {
  methods: PaymentMethod[];
  methodId: string;
  setMethodId: (id: string) => void;
  total: number;
  submitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  const { data: settings } = useQuery(siteSettingsQuery);
  const logoUrl = settings?.site_logo_url;
  const siteName = settings?.site_name || "DDS-Digital";

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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Mobile Banking
          </div>
          <h2 className="font-display font-bold text-xl mt-3">মোবাইল ব্যাংকিং</h2>
          <p className="text-xs text-muted-foreground mt-1">পেমেন্ট মেথড সিলেক্ট করুন</p>
        </div>

        {/* 2x2 method grid */}
        {methods.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">কোনো পেমেন্ট মেথড সেটআপ করা হয়নি।</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {methods.map((m) => {
              const brand = brandFor(m.name);
              const selected = methodId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodId(m.id)}
                  className={`relative rounded-3xl p-6 transition-all duration-200 backdrop-blur-xl border bg-white/90 hover:bg-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 ${
                    selected ? "border-transparent ring-4 scale-[1.02]" : "border-white/40"
                  }`}
                  style={selected && brand ? { boxShadow: `0 12px 40px -8px ${brand.color}55`, ["--tw-ring-color" as never]: brand.color } : undefined}
                >
                  {selected && (
                    <div
                      className="absolute top-3 right-3 h-6 w-6 rounded-full grid place-items-center shadow-md"
                      style={{ backgroundColor: brand?.color ?? "#000" }}
                    >
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <div className="aspect-[5/3] grid place-items-center">
                    <span
                      className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight"
                      style={{ color: brand?.color ?? "#111" }}
                    >
                      {brand?.label ?? m.name}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Submit button (appears after selection) */}
        {methodId && (
          <div className="mt-8 animate-slide-in-bottom">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="w-full rounded-2xl bg-white text-black px-6 py-4 text-base font-bold shadow-xl hover:scale-[1.01] transition disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              সাবমিট করুন
            </button>
          </div>
        )}

        <div className="text-center mt-6">
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

function Field({ label, value, onChange, placeholder, type = "text", id, error }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; id?: string; error?: boolean }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block">{label}</label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${error ? "border-2 border-destructive ring-2 ring-destructive/30" : ""}`} />
    </div>
  );
}
