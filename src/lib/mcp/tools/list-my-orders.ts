import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { err, ok, requireAuth, supabaseForUser } from "./_helpers";

const STATUSES = ["pending", "paid", "shipped", "cancelled", "failed"] as const;

export default defineTool({
  name: "list_my_orders",
  title: "List my orders",
  description: "List the signed-in user's own Kani Estate orders with status, totals, and Razorpay references.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max orders to return (1-50, default 20)."),
    status: z.enum(STATUSES).optional().describe("Optional status filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, status }, ctx) => {
    const authErr = requireAuth(ctx);
    if (authErr) return authErr;
    try {
      let q = supabaseForUser(ctx)
        .from("orders")
        .select(
          "id, created_at, status, total_cents, ship_name, ship_city, razorpay_order_id, razorpay_payment_id, paid_at, order_items(product_name, quantity, unit_price_cents)",
        )
        .order("created_at", { ascending: false })
        .limit(limit ?? 20);
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) return err(error.message, "db_error");
      return ok(JSON.stringify(data, null, 2), { orders: data ?? [], count: data?.length ?? 0 });
    } catch (e) {
      return err(e instanceof Error ? e.message : "Unexpected error", "internal_error");
    }
  },
});
