import { defineTool } from "@lovable.dev/mcp-js";
import { err, ok, requireAuth } from "./_helpers";

export default defineTool({
  name: "whoami",
  title: "Who am I",
  description: "Return the signed-in user's id and email from the verified access token.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx) => {
    const authErr = requireAuth(ctx);
    if (authErr) return authErr;
    try {
      const info = {
        user_id: ctx.getUserId(),
        email: ctx.getUserEmail() ?? null,
        client_id: ctx.getClientId() ?? null,
      };
      return ok(JSON.stringify(info, null, 2), info);
    } catch (e) {
      return err(e instanceof Error ? e.message : "Unexpected error", "internal_error");
    }
  },
});
