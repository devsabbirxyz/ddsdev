import { useLocation, Link } from "@tanstack/react-router";
import { GitCompareArrows, X, Star, ShoppingCart, Trash2 } from "lucide-react";
import { useCompare } from "@/lib/compare";
import { useCart } from "@/lib/cart";
import { formatBDT } from "@/lib/storefront";
import { toast } from "sonner";

export function CompareDrawer() {
  const { items, open, setOpen, remove, clear } = useCompare();
  const { addItem } = useCart();
  const loc = useLocation();

  // Hide on cart/checkout
  const hidden = loc.pathname.startsWith("/cart") || loc.pathname.startsWith("/checkout");
  if (hidden) return null;

  return (
    <>
      {/* Floating pill */}
      {items.length > 0 && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 lg:bottom-6 right-4 z-[60] inline-flex items-center gap-2 rounded-full bg-gradient-brand px-4 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:scale-105 transition animate-fade-in"
          aria-label="Compare products"
        >
          <GitCompareArrows className="h-4 w-4" />
          তুলনা ({items.length})
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full sm:max-w-5xl max-h-[90vh] overflow-hidden rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5 text-primary" />
                <h2 className="font-display font-bold text-lg">প্রোডাক্ট তুলনা ({items.length})</h2>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clear}
                    className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" /> ক্লিয়ার
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl hover:bg-accent"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto p-5">
              {items.length === 0 ? (
                <div className="text-center py-10">
                  <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl glass-card mb-3">
                    <GitCompareArrows className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">তুলনা করতে প্রোডাক্ট কার্ডের তুলনা বাটনে ক্লিক করুন।</p>
                </div>
              ) : (
                <div className={`grid gap-4 ${items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`}>
                  {items.map((it) => {
                    const hasDiscount = it.price != null && it.regularPrice != null && it.price < it.regularPrice;
                    const outOfStock = !!it.trackStock && (it.stockQuantity ?? 0) <= 0;
                    return (
                      <div key={it.id} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                        <div className="relative aspect-square bg-gradient-to-br from-primary/10 to-secondary/10">
                          {it.image ? (
                            <img src={it.image} alt={it.title} className="absolute inset-0 h-full w-full object-cover" />
                          ) : (
                            <div className="absolute inset-0 grid place-items-center font-display font-bold text-2xl text-gradient-brand">
                              {it.title.slice(0, 2)}
                            </div>
                          )}
                          <button
                            onClick={() => remove(it.id)}
                            className="absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-destructive hover:text-destructive-foreground transition"
                            aria-label="Remove"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="p-3 flex-1 flex flex-col gap-2 text-xs">
                          <Link
                            to="/product/$slug"
                            params={{ slug: it.slug }}
                            onClick={() => setOpen(false)}
                            className="font-display font-bold text-sm line-clamp-2 hover:text-primary"
                          >
                            {it.title}
                          </Link>
                          {it.sellerName && <div className="text-[10px] text-muted-foreground">by {it.sellerName}</div>}

                          <div className="flex items-baseline gap-1.5 mt-1">
                            <span className="font-display font-bold text-sm text-gradient-brand">{formatBDT(it.price)}</span>
                            {hasDiscount && (
                              <span className="text-[10px] text-muted-foreground line-through">{formatBDT(it.regularPrice)}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-0.5 text-yellow-500">
                              <Star className="h-3 w-3 fill-current" />
                              {(it.rating ?? 0).toFixed(1)}
                            </span>
                            <span className="text-muted-foreground">({it.totalReviews ?? 0})</span>
                          </div>

                          <div className="text-[11px]">
                            স্টক:{" "}
                            <span className={outOfStock ? "text-destructive font-semibold" : "text-primary font-semibold"}>
                              {outOfStock ? "নেই" : "আছে"}
                            </span>
                          </div>

                          {it.shortDescription && (
                            <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                              {it.shortDescription}
                            </p>
                          )}

                          <button
                            disabled={outOfStock}
                            onClick={() => {
                              addItem({
                                productId: it.id,
                                slug: it.slug,
                                title: it.title,
                                price: Number(it.price ?? 0),
                                image: it.image,
                                quantity: 1,
                              });
                              toast.success("কার্টে যোগ হয়েছে");
                            }}
                            className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-brand px-3 py-2 text-xs font-bold text-primary-foreground shadow-glow hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            কার্টে যোগ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
