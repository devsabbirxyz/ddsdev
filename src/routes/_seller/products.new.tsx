import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/seller/ProductForm";

export const Route = createFileRoute("/_seller/products/new")({
  head: () => ({ meta: [{ title: "New Product — Seller" }, { name: "robots", content: "noindex" }] }),
  component: () => <ProductForm />,
});
