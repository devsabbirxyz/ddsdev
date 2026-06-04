import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, queryOptions } from "@tanstack/react-query";
import { ProductForm } from "@/components/seller/ProductForm";
import { getMySellerProduct } from "@/lib/seller-owner.functions";

const productQuery = (id: string) =>
  queryOptions({
    queryKey: ["seller", "product", id],
    queryFn: async () => {
      return await getMySellerProduct({ data: { id } });
    },
  });

export const Route = createFileRoute("/seller/products/$id")({
  head: () => ({ meta: [{ title: "Edit Product — Seller" }, { name: "robots", content: "noindex" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = useParams({ from: "/seller/products/$id" });
  const { data, isLoading } = useQuery(productQuery(id));
  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!data) return <div>Not found</div>;
  return <ProductForm initial={data as any} />;
}
