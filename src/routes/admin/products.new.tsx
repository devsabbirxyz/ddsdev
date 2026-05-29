import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { saveProduct } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Package, Layers, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/admin/products/new")({
  head: () => ({ meta: [{ title: "New Product — Admin" }, { name: "robots", content: "noindex" }] }),
  component: NewProduct,
});

function NewProduct() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const save = useServerFn(saveProduct);

  const create = async (variant: boolean) => {
    try {
      const r = await save({
        data: {
          title: variant ? "নতুন ভ্যারিয়েন্ট প্রোডাক্ট" : "নতুন প্রোডাক্ট",
          delivery_type: "instant_text",
          status: "approved",
          is_active: true,
          is_variant: variant,
        },
      });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
      nav({ to: "/admin/products/$id" as any, params: { id: r.id } as any });
    } catch (e: any) {
      toast.error(`❌ ${e.message || "সমস্যা হয়েছে"}`);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link to="/admin/products" className="glass-card rounded-xl p-2 hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl">নতুন প্রোডাক্ট যোগ করুন</h1>
          <p className="text-sm text-muted-foreground mt-1">প্রথমে প্রোডাক্ট টাইপ সিলেক্ট করুন।</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <button
          onClick={() => create(false)}
          className="group glass-card rounded-3xl p-8 text-left hover:shadow-glow hover:scale-[1.02] transition relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition" />
          <div className="relative">
            <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground shadow-glow mb-4">
              <Package className="h-7 w-7" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">রেগুলার প্রোডাক্ট</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              একটি মাত্র মূল্য (রেগুলার + অফার) যুক্ত করুন। কোনো ভ্যারিয়েন্ট নেই।
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <li>✓ Regular Price + Offer Price</li>
              <li>✓ একই ডেলিভারি কনটেন্ট সবার জন্য</li>
              <li>✓ সিম্পল সেটআপ</li>
            </ul>
          </div>
        </button>

        <button
          onClick={() => create(true)}
          className="group glass-card rounded-3xl p-8 text-left hover:shadow-glow hover:scale-[1.02] transition relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-secondary/10 blur-3xl group-hover:bg-secondary/20 transition" />
          <div className="relative">
            <div className="inline-grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary text-primary-foreground shadow-glow mb-4">
              <Layers className="h-7 w-7" />
            </div>
            <h2 className="font-display font-bold text-xl mb-2">ভ্যারিয়েন্ট প্রোডাক্ট</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              একাধিক ভ্যারিয়েন্ট (যেমন 1 month / 3 month / 1 year) — প্রতিটির আলাদা মূল্য।
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
              <li>✓ Multiple variants (Name + Price)</li>
              <li>✓ প্রতি ভ্যারিয়েন্টে আলাদা Regular & Offer Price</li>
              <li>✓ আলাদা ডেলিভারি কনটেন্ট</li>
            </ul>
          </div>
        </button>
      </div>
    </div>
  );
}
