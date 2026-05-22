import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, Minus, Plus, ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatBDT } from "@/lib/storefront";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "কার্ট — DDS-Digital" }, { name: "robots", content: "noindex" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, updateQty, removeItem, clear } = useCart();
  const { isAuthenticated } = useAuth();
  const nav = useNavigate();

  const goCheckout = () => {
    if (!isAuthenticated) nav({ to: "/login", search: { redirect: "/checkout" } as never });
    else nav({ to: "/checkout" });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 text-center">
        <div className="mx-auto h-20 w-20 grid place-items-center rounded-3xl glass-card mb-4">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display font-bold text-3xl">আপনার কার্ট খালি</h1>
        <p className="mt-2 text-sm text-muted-foreground">শপিং শুরু করতে নিচের বাটনে ক্লিক করুন।</p>
        <Link to="/shop" className="mt-6 inline-block rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">শপে যান</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      <h1 className="font-display font-bold text-3xl mb-6">আপনার কার্ট ({items.length})</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {items.map((it) => (
            <div key={`${it.productId}-${it.variantId ?? ""}`} className="glass-card rounded-2xl p-4 flex gap-4">
              <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden glass grid place-items-center">
                {it.image ? <img src={it.image} alt={it.title} className="h-full w-full object-cover" /> : <span className="font-display font-bold text-xl text-gradient-brand">{it.title.slice(0, 2)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <Link to="/product/$slug" params={{ slug: it.slug }} className="font-semibold hover:text-primary line-clamp-1">{it.title}</Link>
                {it.variantLabel && <div className="text-xs text-muted-foreground mt-0.5">{it.variantLabel}</div>}
                <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1 rounded-xl glass p-1">
                    <button onClick={() => updateQty(it.productId, it.quantity - 1, it.variantId)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent"><Minus className="h-3 w-3" /></button>
                    <span className="px-2 text-sm font-semibold min-w-6 text-center">{it.quantity}</span>
                    <button onClick={() => updateQty(it.productId, it.quantity + 1, it.variantId)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent"><Plus className="h-3 w-3" /></button>
                  </div>
                  <div className="font-display font-bold text-lg text-gradient-brand">{formatBDT(it.price * it.quantity)}</div>
                </div>
              </div>
              <button onClick={() => removeItem(it.productId, it.variantId)} className="self-start rounded-lg p-2 hover:bg-accent text-muted-foreground hover:text-destructive transition" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">কার্ট খালি করুন</button>
        </div>

        <aside className="glass-card rounded-2xl p-6 h-fit lg:sticky lg:top-24">
          <h2 className="font-display font-bold text-lg mb-4">অর্ডার সারমর্ম</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">সাবটোটাল</span><span className="font-semibold">{formatBDT(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ডেলিভারি</span><span className="text-primary font-semibold">ফ্রি</span></div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between text-base">
              <span className="font-bold">মোট</span>
              <span className="font-display font-bold text-xl text-gradient-brand">{formatBDT(subtotal)}</span>
            </div>
          </div>
          <button onClick={goCheckout} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition">
            চেকআউট <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-[11px] text-center text-muted-foreground">কুপন কোড চেকআউটে অ্যাপ্লাই করুন</p>
        </aside>
      </div>
    </div>
  );
}
