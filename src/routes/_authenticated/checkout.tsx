import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Tag, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!name.trim() || !email.trim() || !phone.trim()) { toast.error("সব তথ্য দিন"); return; }
    setStep(2);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!user) { toast.error("লগইন করুন"); return; }
    if (items.length === 0) { toast.error("কার্ট খালি"); return; }
    if (!methodId || !method) { toast.error("পেমেন্ট মেথড সিলেক্ট করুন"); return; }
    if (method.is_manual_active && !trxId.trim()) { toast.error("ট্রানজেকশন আইডি দিন"); return; }

    setSubmitting(true);
    try {
      const orderNumber = `DDS-${Date.now().toString(36).toUpperCase()}`;
      const perItemDiscount = items.length > 0 ? Math.floor(discount / items.length) : 0;
      const rows = items.map((it, idx) => ({
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
      const firstOrderId = data?.[0]?.id;
      clear();
      toast.success("অর্ডার সফল! অ্যাডমিন verify করার পর deliver হবে।");
      if (firstOrderId) nav({ to: "/order/$id", params: { id: firstOrderId } });
      else nav({ to: "/dashboard/orders" });
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
                <Field label="পূর্ণ নাম *" value={name} onChange={setName} placeholder="Md. Sabbir" />
                <Field label="ফোন নম্বর *" value={phone} onChange={setPhone} placeholder="01XXXXXXXXX" />
                <div className="sm:col-span-2"><Field label="ইমেইল *" value={email} onChange={setEmail} placeholder="you@example.com" type="email" /></div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold mb-1.5 block">প্রোডাক্টের জন্য তথ্য (যেমন ইমেইল/ইউজারনেম)</label>
                  <textarea value={customerInput} onChange={(e) => setCustomerInput(e.target.value)} rows={2} placeholder="যেকোনো অতিরিক্ত তথ্য" className="w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="glass-card rounded-2xl p-6">
              <button onClick={() => setStep(1)} className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> তথ্য এডিট করুন
              </button>
              <h2 className="font-display font-bold text-lg mb-4">পেমেন্ট মেথড সিলেক্ট করুন</h2>
              {methods.length === 0 ? (
                <p className="text-sm text-muted-foreground">এখনো কোনো পেমেন্ট মেথড সেটআপ করা হয়নি।</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethodId(m.id)}
                      className={`text-left rounded-xl p-4 transition ${methodId === m.id ? "bg-gradient-brand text-primary-foreground shadow-glow" : "glass hover:bg-accent"}`}
                    >
                      <div className="font-bold">{m.name}</div>
                      {m.account_number && <div className={`text-xs mt-1 ${methodId === m.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{m.account_type ? `${m.account_type} · ` : ""}{m.account_number}</div>}
                    </button>
                  ))}
                </div>
              )}
              {method?.instructions && (
                <div className="mt-4 rounded-xl glass p-4 text-xs leading-relaxed whitespace-pre-wrap">{method.instructions}</div>
              )}
              {method && method.is_manual_active && (
                <div className="mt-4">
                  <label className="text-xs font-semibold mb-1.5 block">ট্রানজেকশন আইডি / TrxID *</label>
                  <input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="যেমন: BHJ2X8YT" className="w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              )}
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

          {step === 1 ? (
            <button onClick={goToPayment} className="w-full rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition">
              অর্ডার কনফার্ম করুন →
            </button>
          ) : (
            <button onClick={submit} disabled={submitting} className="w-full rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition disabled:opacity-60 disabled:hover:scale-100 inline-flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              পেমেন্ট সাবমিট করুন
            </button>
          )}
          <p className="text-[11px] text-center text-muted-foreground">অ্যাডমিন verify করার পর প্রোডাক্ট deliver হবে।</p>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-semibold mb-1.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl glass px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
    </div>
  );
}
