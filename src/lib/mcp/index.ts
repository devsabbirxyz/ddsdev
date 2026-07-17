import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import listMyOrders from "./tools/list-my-orders";
import getMyWallet from "./tools/get-my-wallet";
import getOrder from "./tools/get-order";

// The OAuth issuer MUST be the direct Supabase host, not the .lovable.cloud proxy.
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "dds-digital-mcp",
  title: "DDS Digital",
  version: "0.1.0",
  instructions:
    "Tools for the DDS Digital storefront. Browse products with `list_products`. Signed-in customers can inspect their orders (`list_my_orders`, `get_order`) and wallet (`get_my_wallet`).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, listMyOrders, getMyWallet, getOrder],
});
