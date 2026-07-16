import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listProducts from "./tools/list-products";
import listMyOrders from "./tools/list-my-orders";
import getOrder from "./tools/get-order";
import subscribeNewsletter from "./tools/subscribe-newsletter";
import whoami from "./tools/whoami";

// The issuer MUST be the direct Supabase host (not the `.lovable.cloud` proxy).
// VITE_SUPABASE_PROJECT_ID is inlined by Vite at build time.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "kani-estate-mcp",
  title: "Kani Estate",
  version: "0.1.0",
  instructions:
    "Tools for Kani Estate — browse the single-origin coffee and spice catalog, look up the signed-in user's orders and payment status, and manage newsletter subscription.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listProducts, listMyOrders, getOrder, subscribeNewsletter, whoami],
});
