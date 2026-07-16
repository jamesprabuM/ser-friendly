import { createClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

export function err(message: string, code?: string) {
  const body = code ? `[${code}] ${message}` : message;
  return {
    content: [{ type: "text" as const, text: body }],
    isError: true,
    structuredContent: { error: { code: code ?? "error", message } },
  };
}

export function ok<T>(text: string, structured: T) {
  return {
    content: [{ type: "text" as const, text }],
    structuredContent: structured as Record<string, unknown>,
  };
}

export function requireEnv() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Server misconfigured: missing Supabase env");
  return { url, key };
}

export function supabaseAnon() {
  const { url, key } = requireEnv();
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function supabaseForUser(ctx: ToolContext) {
  const { url, key } = requireEnv();
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function requireAuth(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) return err("You must be signed in to call this tool.", "unauthenticated");
  return null;
}
