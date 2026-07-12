import { Check, X } from "lucide-react";
import { formatBDT } from "@/lib/storefront";

type Variant = {
  id: string;
  label: string;
  regular_price: number | null;
  offer_price: number | null;
  stock_quantity: number | null;
  is_active: boolean;
};

export function VariantCompareTable({
  variants,
  selectedId,
  onSelect,
  trackStock,
}: {
  variants: Variant[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  trackStock?: boolean;
}) {
  const active = variants.filter((v) => v.is_active);
  if (active.length < 2) return null;

  const maxOffer = Math.max(...active.map((v) => Number(v.offer_price ?? v.regular_price ?? 0)));
  const bestValueId = active
    .slice()
    .sort((a, b) => Number(a.offer_price ?? a.regular_price ?? 0) - Number(b.offer_price ?? b.regular_price ?? 0))[0]?.id;

  return (
    <section className="mt-6 glass-card rounded-2xl p-4 sm:p-5 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-base">ভ্যারিয়েন্ট তুলনা</h3>
        <span className="text-[10px] text-muted-foreground">সেরা দাম হাইলাইটেড</span>
      </div>
      <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
        <table className="w-full text-sm min-w-[420px]">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border/60">
              <th className="py-2 text-left font-semibold">ভ্যারিয়েন্ট</th>
              <th className="py-2 text-right font-semibold">দাম</th>
              <th className="py-2 text-right font-semibold">সেভ</th>
              {trackStock && <th className="py-2 text-right font-semibold">স্টক</th>}
              <th className="py-2 text-right font-semibold">নির্বাচন</th>
            </tr>
          </thead>
          <tbody>
            {active.map((v) => {
              const offer = Number(v.offer_price ?? v.regular_price ?? 0);
              const reg = Number(v.regular_price ?? 0);
              const save = reg > offer ? reg - offer : 0;
              const isBest = v.id === bestValueId;
              const isSelected = v.id === selectedId;
              const outOfStock = trackStock && v.stock_quantity != null && Number(v.stock_quantity) <= 0;
              return (
                <tr
                  key={v.id}
                  className={`border-b border-border/40 last:border-0 ${isSelected ? "bg-primary/5" : ""}`}
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{v.label}</span>
                      {isBest && (
                        <span className="rounded-full bg-gradient-brand text-primary-foreground px-2 py-0.5 text-[9px] font-bold">
                          BEST
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="font-bold text-gradient-brand">{formatBDT(offer)}</div>
                    {reg > offer && (
                      <div className="text-[10px] text-muted-foreground line-through">{formatBDT(reg)}</div>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-xs">
                    {save > 0 ? (
                      <span className="text-emerald-500 font-semibold">-{Math.round((save / reg) * 100)}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  {trackStock && (
                    <td className="py-2.5 text-right text-xs">
                      {v.stock_quantity == null ? (
                        <Check className="h-3.5 w-3.5 inline text-emerald-500" />
                      ) : outOfStock ? (
                        <span className="text-destructive font-semibold inline-flex items-center gap-1">
                          <X className="h-3 w-3" /> শেষ
                        </span>
                      ) : (
                        <span>{v.stock_quantity}</span>
                      )}
                    </td>
                  )}
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => onSelect?.(v.id)}
                      disabled={outOfStock}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                        isSelected
                          ? "bg-gradient-brand text-primary-foreground shadow-glow"
                          : "glass hover:bg-accent"
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isSelected ? "নির্বাচিত" : "বেছে নিন"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {maxOffer > 0 && <div className="sr-only">Max: {maxOffer}</div>}
    </section>
  );
}
