import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Tag, Loader2, ArrowLeft, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatBDT } from "@/lib/storefront";

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

// Brand theme per mobile-banking method (matched by lowercased name)
type Theme = { app: string; ussd?: string; box: string; btn: string; text: string; chip: string };
const METHOD_THEME: Record<string, Theme> = {
  bkash:  { app: "bKash",  ussd: "*247#", box: "bg-pink-600 text-white",       btn: "bg-pink-600 hover:bg-pink-700 text-white",       text: "text-white",  chip: "bg-white/15 text-white" },
  nagad:  { app: "Nagad",  ussd: "*167#", box: "bg-orange-500 text-white",     btn: "bg-orange-500 hover:bg-orange-600 text-white",   text: "text-white",  chip: "bg-white/15 text-white" },
  rocket: { app: "Rocket", ussd: "*322#", box: "bg-purple-600 text-white",     btn: "bg-purple-600 hover:bg-purple-700 text-white",   text: "text-white",  chip: "bg-white/15 text-white" },
  upay:   { app: "Upay",   ussd: undefined, box: "bg-yellow-400 text-black",   btn: "bg-yellow-400 hover:bg-yellow-500 text-black",   text: "text-black",  chip: "bg-black/15 text-black" },
};
function themeFor(name?: string | null): Theme | null {
  if (!name) return null;
  const k = name.toLowerCase().replace(/\s+/g, "");
  for (const key of Object.keys(METHOD_THEME)) if (k.includes(key)) return METHOD_THEME[key];
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
    if (method.is_manual_active && !trxId.trim()) { toast.error("ট্রানজেকশন আইডি দিন"); return; }


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

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-3xl">চেকআউট</h1>
        <div className="flex items-center gap-2 text-xs">
          <span className={`px-3 py-1.5 rounded-full font-semibold ${step === 1 ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass text-muted-foreground"}`}>১. তথ্য</span>
          <span className="text-muted-foreground">→</span>
          <span className={`px-3 py-1.5 rounded-full font-semibold ${step === 2 ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass text-muted-foreground"}`}>২. পেমেন্ট</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
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
          )}

          {step === 2 && (
            <section className="glass-card rounded-2xl p-6">
              <button onClick={() => setStep(1)} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> তথ্য এডিট করুন
              </button>

              {/* Method picker */}
              {!methodId && (
                <>
                  <div className="text-center mb-4">
                    <h2 className="font-display font-bold text-lg">MOBILE BANKING</h2>
                    <p className="text-xs text-muted-foreground mt-1">পেমেন্ট মেথড সিলেক্ট করুন</p>
                  </div>
                  {methods.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">এখনো কোনো পেমেন্ট মেথড সেটআপ করা হয়নি।</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {methods.map((m) => {
                        const th = themeFor(m.name);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { setMethodId(m.id); setPaymentTab("manual"); }}
                            className={`rounded-2xl p-6 text-center transition hover:scale-[1.02] shadow-lg ${th ? th.box : "glass"}`}
                          >
                            <div className={`font-display font-bold text-xl ${th?.text ?? ""}`}>{m.name}</div>
                            <div className={`text-[11px] mt-1 opacity-80 ${th?.text ?? "text-muted-foreground"}`}>Tap to select</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Selected method view */}
              {method && (() => {
                const th = themeFor(method.name);
                return (
                  <div className="space-y-4">
                    {/* Selected header card */}
                    <div className={`rounded-2xl p-5 flex items-center justify-between ${th ? th.box : "glass"}`}>
                      <div>
                        <div className={`font-display font-bold text-2xl ${th?.text ?? ""}`}>{method.name}</div>
                        <div className={`text-xs mt-0.5 opacity-80 ${th?.text ?? ""}`}>সিলেক্টেড পেমেন্ট মেথড</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setMethodId(""); setTrxId(""); }}
                        className={`text-xs rounded-lg px-3 py-1.5 font-semibold ${th?.chip ?? "glass"}`}
                      >
                        পরিবর্তন
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl glass">
                      <button
                        type="button"
                        onClick={() => setPaymentTab("automatic")}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${paymentTab === "automatic" ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-accent"}`}
                      >
                        Automatic
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentTab("manual")}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${paymentTab === "manual" ? "bg-gradient-brand text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-accent"}`}
                      >
                        Manual
                      </button>
                    </div>

                    {/* Automatic tab */}
                    {paymentTab === "automatic" && (
                      <>
                        {method.has_automatic && method.is_automatic_active ? (
                          <div className="rounded-2xl glass p-6 text-center space-y-3">
                            <p className="text-sm text-muted-foreground">Automatic পেমেন্ট গেটওয়ে শীঘ্রই যুক্ত হচ্ছে।</p>
                          </div>
                        ) : (
                          <div className="rounded-2xl bg-black text-white p-10 text-center">
                            <div className="font-display font-bold text-3xl">Available নেই</div>
                            <p className="text-xs mt-2 text-white/60">দয়া করে Manual অপশন ব্যবহার করুন।</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Manual tab */}
                    {paymentTab === "manual" && (
                      <>
                        {!method.is_manual_active ? (
                          <div className="rounded-2xl bg-black text-white p-10 text-center">
                            <div className="font-display font-bold text-3xl">Available নেই</div>
                          </div>
                        ) : (
                          <div className={`rounded-2xl p-5 sm:p-6 space-y-4 shadow-lg ${th ? th.box : "glass"}`}>
                            <h3 className={`font-display font-bold text-xl text-center ${th?.text ?? ""}`}>ট্রানজেকশন আইডি দিন</h3>
                            <input
                              id="field-trxId"
                              value={trxId}
                              onChange={(e) => setTrxId(e.target.value)}
                              placeholder="ট্রানজেকশন আইডি লিখুন"
                              className="w-full rounded-xl bg-white text-black px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-white/60 placeholder:text-black/40"
                            />

                            {method.instructions ? (
                              <div className={`rounded-xl bg-white/10 p-4 text-sm leading-relaxed whitespace-pre-wrap ${th?.text ?? ""}`}>{method.instructions}</div>
                            ) : (
                              <ol className={`space-y-2.5 text-sm ${th?.text ?? ""}`}>
                                <Step n={1}>
                                  {th?.app ?? method.name} অ্যাপ খুলুন{th?.ussd ? <> অথবা <strong>{th.ussd}</strong> ডায়াল করুন</> : null}
                                </Step>
                                <Step n={2}><strong>"Send Money"</strong> সিলেক্ট করুন</Step>
                                <Step n={3}>
                                  Receiver নম্বর দিন:{" "}
                                  <strong className="font-mono">{method.account_number ?? "—"}</strong>
                                  {method.account_number && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard?.writeText(method.account_number ?? "");
                                        toast.success("নম্বর কপি হয়েছে");
                                      }}
                                      className={`ml-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${th?.chip ?? "glass"}`}
                                    >
                                      <Copy className="h-3 w-3" /> কপি
                                    </button>
                                  )}
                                </Step>
                                <Step n={4}>পরিমাণ দিন: <strong className="font-mono">{formatBDT(total)}</strong></Step>
                                <Step n={5}>Reference এ আপনার নাম লিখুন</Step>
                                <Step n={6}>PIN দিয়ে confirm করুন</Step>
                                <Step n={7}>Confirmation SMS পেলে ট্রানজেকশন আইডি উপরের বক্সে দিন এবং <strong>"যাচাই করুন"</strong> বাটনে চাপুন</Step>
                              </ol>
                            )}

                            <button
                              type="button"
                              onClick={submit}
                              disabled={submitting}
                              className={`w-full rounded-xl px-6 py-3.5 text-base font-bold shadow-lg transition hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center justify-center gap-2 bg-white ${th?.text ?? "text-black"}`}
                            >
                              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                              যাচাই করুন
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </section>
          )}
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

          {step === 1 && (
            <button onClick={goToPayment} className="w-full rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition">
              অর্ডার কনফার্ম করুন →
            </button>
          )}
          <p className="text-[11px] text-center text-muted-foreground">অ্যাডমিন verify করার পর প্রোডাক্ট deliver হবে।</p>
        </aside>
      </div>

      <Dialog open={successOpen} onOpenChange={(o) => { if (!o) { setSuccessOpen(false); nav({ to: "/dashboard/orders" }); } }}>
        <DialogContent className="sm:max-w-md text-center">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand shadow-glow">
              <CheckCircle2 className="h-9 w-9 text-primary-foreground" />
            </div>
            <DialogTitle className="font-display text-2xl text-center">আপনার অর্ডার সফলভাবে সাবমিট হয়েছে! ✅</DialogTitle>
            <DialogDescription className="text-center">
              অ্যাডমিন verify করার পর প্রোডাক্ট deliver হবে। ড্যাশবোর্ড থেকে অর্ডারের বর্তমান অবস্থা (Pending / Processing / Delivered) দেখতে পারবেন।
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <button
              onClick={() => { setSuccessOpen(false); nav({ to: "/dashboard/orders" }); }}
              className="w-full rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition"
            >
              ড্যাশবোর্ড দেখুন →
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
