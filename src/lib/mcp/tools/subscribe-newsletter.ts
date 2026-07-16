import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { err, ok, supabaseAnon } from "./_helpers";

export default defineTool({
  name: "subscribe_newsletter",
  title: "Subscribe to newsletter",
  description: "Add an email to the Kani Estate newsletter list.",
  inputSchema: {
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(3)
      .max(254)
      .email({ message: "Please provide a valid email address." })
      .describe("Email address to subscribe."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ email }) => {
    try {
      const supabase = supabaseAnon();
      const { error } = await supabase.from("newsletter_subscribers").insert({ email });
      if (error) {
        if (error.code === "23505") {
          return ok(`Already subscribed: ${email}`, { email, already_subscribed: true });
        }
        return err(error.message, "db_error");
      }
      return ok(`Subscribed ${email}`, { email, subscribed: true });
    } catch (e) {
      return err(e instanceof Error ? e.message : "Unexpected error", "internal_error");
    }
  },
});
