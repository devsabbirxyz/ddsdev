import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm } from "@/components/seller/ProductForm";

const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["seller", "product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const Route = createFileRoute("/_seller/products/$id")({
  head: () => ({ meta: [{ title: "Edit Product — Seller" }, { name: "robots", content: "noindex" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = useParams({ from: "/_seller/products/$id" });
  const { data, isLoading } = useQuery(productQuery(id));
  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!data) return <div>Not found</div>;
  return <ProductForm initial={data as any} />;
}
