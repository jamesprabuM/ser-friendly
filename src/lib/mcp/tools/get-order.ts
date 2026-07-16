import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { err, ok, requireAuth, supabaseForUser } from "./_helpers";

export default defineTool({
  name: "get_order",
  title: "Get order details",
  description: "Fetch a single order the signed-in user owns, including shipping address and line items.",
  inputSchema: {
    order_id: z
      .string()
      .trim()
      .uuid({ message: "order_id must be a valid UUID." })
      .describe("The order id (uuid)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ order_id }, ctx) => {
    const authErr = requireAuth(ctx);
    if (authErr) return authErr;
    try {
      const { data, error } = await supabaseForUser(ctx)
        .from("orders")
        .select("*, order_items(product_name, quantity, unit_price_cents)")
        .eq("id", order_id)
        .maybeSingle();
      if (error) return err(error.message, "db_error");
      if (!data) return err("Order not found or you do not have access to it.", "not_found");
      return ok(JSON.stringify(data, null, 2), { order: data });
    } catch (e) {
      return err(e instanceof Error ? e.message : "Unexpected error", "internal_error");
    }
  },
});
