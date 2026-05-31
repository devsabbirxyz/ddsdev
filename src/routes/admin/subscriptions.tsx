import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatBDT } from "@/lib/storefront";
import { Plus, Trash2, CalendarClock } from "lucide-react";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "সাবস্ক্রিপশন প্ল্যান — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSubscriptionPlans,
});

const productsQ = queryOptions({
  queryKey: ["admin", "sub-products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id,title,delivery_type")
      .eq("delivery_type", "subscription")
      .order("title", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

const plansQ = queryOptions({
  queryKey: ["admin", "subscription-plans"],
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from("subscription_plans")
      .select("id,product_id,name,name_en,price,duration_days,is_active,sort_order,created_at")
      .order("product_id", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as any[];
  },
});

function AdminSubscriptionPlans() {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery(productsQ);
  const { data: plans = [], isLoading } = useQuery(plansQ);

  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [days, setDays] = useState<number>(30);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error("প্রোডাক্ট সিলেক্ট করুন");
      if (!name.trim()) throw new Error("নাম দিন");
      if (price <= 0) throw new Error("মূল্য 0 এর বেশি");
      if (days <= 0) throw new Error("দিন 0 এর বেশি");
      const { error } = await (supabase as any).from("subscription_plans").insert({
        product_id: productId,
        name: name.trim(),
        price,
        duration_days: days,
        is_active: true,
        sort_order: 0,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("প্ল্যান যোগ হয়েছে");
      setName(""); setPrice(0); setDays(30);
      qc.invalidateQueries({ queryKey: ["admin", "subscription-plans"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async (v: { id: string; is_active: boolean }) => {
      const { error } = await (supabase as any)
        .from("subscription_plans")
        .update({ is_active: v.is_active })
        .eq("id", v.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscription-plans"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("subscription_plans").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("ডিলিট হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "subscription-plans"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const productMap = new Map(products.map((p: any) => [p.id, p]));
  const grouped = plans.reduce((acc: Record<string, any[]>, p: any) => {
    (acc[p.product_id] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display font-bold text-2xl flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-primary" />
          সাবস্ক্রিপশন প্ল্যান
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          প্রোডাক্টের জন্য প্ল্যান (১ মাস, ৩ মাস ইত্যাদি) তৈরি ও ম্যানেজ করুন।
          শুধু <code className="text-xs glass px-1 rounded">delivery_type = subscription</code> প্রোডাক্টের জন্য।
        </p>
      </div>

      {/* Create form */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h2 className="font-bold">নতুন প্ল্যান যোগ করুন</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <Label className="text-xs">প্রোডাক্ট</Label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full mt-1 rounded-xl glass px-3 py-2 text-sm bg-background"
            >
              <option value="">— সিলেক্ট করুন —</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">প্ল্যান নাম</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="১ মাস" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">মূল্য (৳)</Label>
            <Input type="number" min={0} value={price || ""} onChange={(e) => setPrice(Number(e.target.value) || 0)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">দিন</Label>
            <Input type="number" min={1} value={days || ""} onChange={(e) => setDays(Number(e.target.value) || 0)} className="mt-1" />
          </div>
        </div>
        <Button onClick={() => createMut.mutate()} disabled={createMut.isPending} className="gap-2">
          <Plus className="h-4 w-4" /> যোগ করুন
        </Button>
        {products.length === 0 && (
          <p className="text-xs text-muted-foreground">
            কোনো সাবস্ক্রিপশন প্রোডাক্ট নেই। প্রথমে প্রোডাক্ট তৈরি করে <code className="glass px-1 rounded">delivery_type</code> = subscription সেট করুন।
          </p>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-12">লোড হচ্ছে...</div>
      ) : plans.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center text-muted-foreground">
          কোনো প্ল্যান নেই
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([pid, list]) => {
            const product: any = productMap.get(pid);
            return (
              <div key={pid} className="glass-card rounded-2xl p-5">
                <h3 className="font-bold mb-3">{product?.title ?? "অজানা প্রোডাক্ট"}</h3>
                <div className="space-y-2">
                  {list.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl glass">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{p.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatBDT(Number(p.price))} · {p.duration_days} দিন
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Switch
                            checked={p.is_active}
                            onCheckedChange={(v) => toggleMut.mutate({ id: p.id, is_active: v })}
                          />
                          <span className="text-muted-foreground">{p.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-8 w-8"
                          onClick={() => {
                            if (confirm("ডিলিট করবেন?")) delMut.mutate(p.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
