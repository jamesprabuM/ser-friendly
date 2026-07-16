import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { next?: string } =>
    typeof s.next === "string" && s.next ? { next: s.next } : {},
  head: () => ({
    meta: [
      { title: "Sign in — Kani Estate" },
      { name: "description", content: "Sign in to your Kani Estate account to track orders and manage subscriptions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

// Only accept a same-origin relative path so we can't be used as an open redirector.
function safeNext(next: string): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const safe = safeNext(next);
  const returnTarget = safe ?? "/account";
  const absoluteReturn = typeof window !== "undefined"
    ? window.location.origin + returnTarget
    : returnTarget;

  useEffect(() => {
    if (!loading && user) {
      // Use a full navigation for consent so the freshly-loaded session is present.
      if (safe) window.location.href = safe;
      else navigate({ to: "/account" });
    }
  }, [user, loading, navigate, safe]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: absoluteReturn },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: absoluteReturn });
      if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <div className="container-estate max-w-md py-24">
        <p className="eyebrow text-center">{mode === "signin" ? "Welcome back" : "New here"}</p>
        <h1 className="mt-3 text-center font-serif text-4xl">
          {mode === "signin" ? "Sign in" : "Create an account"}
        </h1>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "Track your orders and manage subscriptions." : "Save your details for faster checkout."}
        </p>

        <button
          type="button"
          onClick={google}
          disabled={busy}
          className="mt-10 w-full rounded-sm border border-border bg-background px-6 py-3.5 text-sm hover:bg-secondary transition disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-widest">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="eyebrow">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="eyebrow">Password</label>
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground" />
          </div>
          <button type="submit" disabled={busy}
            className="w-full rounded-sm bg-primary px-6 py-3.5 text-sm text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "No account yet? " : "Already have an account? "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="underline text-foreground">
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="underline">Back to home</Link>
        </p>
      </div>
    </SiteLayout>
  );
}
