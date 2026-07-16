import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { err, ok, supabaseAnon } from "./_helpers";

const CATEGORIES = ["coffee", "spice", "gift"] as const;

export default defineTool({
  name: "list_products",
  title: "List products",
  description: "List published products in the Kani Estate catalog with price (paise), stock, and category.",
  inputSchema: {
    category: z.enum(CATEGORIES).optional().describe("Optional category filter."),
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (1-100, default 50)."),
    featured_only: z.boolean().optional().describe("If true, only return featured products."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category, limit, featured_only }) => {
    try {
      const supabase = supabaseAnon();
      let q = supabase
        .from("products")
        .select("id, name, slug, category, price_cents, stock, featured, published, short_description")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(limit ?? 50);
      if (category) q = q.eq("category", category);
      if (featured_only) q = q.eq("featured", true);
      const { data, error } = await q;
      if (error) return err(error.message, "db_error");
      return ok(JSON.stringify(data, null, 2), { products: data ?? [], count: data?.length ?? 0 });
    } catch (e) {
      return err(e instanceof Error ? e.message : "Unexpected error", "internal_error");
    }
  },
});
