import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "subscribe_newsletter",
  title: "Subscribe to newsletter",
  description: "Add an email to the Kani Estate newsletter list.",
  inputSchema: {
    email: z.string().email().describe("Email address to subscribe."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ email }, ctx: ToolContext) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: ctx.isAuthenticated()
          ? { headers: { Authorization: `Bearer ${ctx.getToken()}` } }
          : undefined,
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return { content: [{ type: "text", text: `Subscribed ${email}` }] };
  },
});
