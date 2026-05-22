import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/storefront";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/wishlist")({
  component: WishPage,
});

function WishPage() {
  const { items, remove, clear } = useWishlist();
  const { addItem } = useCart();

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center">
        <Heart className="h-10 w-10 mx-auto text-muted-foreground" />
        <h1 className="mt-3 font-display font-bold text-xl">উইশলিস্ট খালি</h1>
        <p className="mt-1 text-sm text-muted-foreground">পছন্দের প্রোডাক্ট ❤️ করে এখানে যোগ করুন</p>
        <Link to="/shop" className="mt-4 inline-block rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">শপে যান</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">উইশলিস্ট ({items.length})</h1>
        <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">সব মুছুন</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <div key={it.productId} className="glass-card rounded-2xl p-4 flex gap-3">
            <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden glass grid place-items-center">
              {it.image ? <img src={it.image} alt={it.title} className="h-full w-full object-cover" /> : <span className="font-display font-bold text-xl text-gradient-brand">{it.title.slice(0, 2)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <Link to="/product/$slug" params={{ slug: it.slug }} className="font-semibold hover:text-primary line-clamp-2 text-sm">{it.title}</Link>
              <div className="mt-1 font-display font-bold text-gradient-brand">{formatBDT(it.price)}</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => { addItem({ productId: it.productId, slug: it.slug, title: it.title, price: it.price, image: it.image, quantity: 1 }); toast.success("কার্টে যোগ করা হয়েছে"); }}
                  className="rounded-lg bg-gradient-brand px-3 py-1.5 text-[11px] font-semibold text-primary-foreground inline-flex items-center gap-1"
                ><ShoppingCart className="h-3 w-3" /> কার্টে</button>
                <button onClick={() => remove(it.productId)} className="rounded-lg glass px-2 py-1.5 text-[11px] hover:bg-destructive/10 hover:text-destructive" aria-label="Remove"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
