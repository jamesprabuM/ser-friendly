import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site-layout";
import { supabase } from "@/integrations/supabase/client";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthDetails = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string; redirect_uri?: string } | null;
  scope?: string;
};
type OAuthResult = { data: OAuthDetails | null; error: { message: string } | null };
const authOauth = (supabase.auth as unknown as {
  oauth: {
    getAuthorizationDetails: (id: string) => Promise<OAuthResult>;
    approveAuthorization: (id: string) => Promise<OAuthResult>;
    denyAuthorization: (id: string) => Promise<OAuthResult>;
  };
}).oauth;

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/auth", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await authOauth.getAuthorizationDetails(authorizationId);
    if (error) throw new Error(error.message);
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="container-estate max-w-md py-24 text-center">
        <p className="eyebrow">Authorization</p>
        <h1 className="mt-3 font-serif text-3xl">Could not load this request</h1>
        <p className="mt-4 text-sm text-muted-foreground break-all">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </SiteLayout>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientName = details?.client?.name ?? "an app";

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await authOauth.approveAuthorization(authorization_id)
      : await authOauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <SiteLayout>
      <div className="container-estate max-w-lg py-20">
        <p className="eyebrow">Authorize connection</p>
        <h1 className="mt-3 font-serif text-3xl md:text-4xl">
          Connect {clientName} to your Kani Estate account
        </h1>
        <p className="mt-5 text-sm text-muted-foreground">
          {clientName} will be able to call this app's enabled tools while you are signed in —
          browse the catalog, look up your own orders, and manage your newsletter subscription.
        </p>
        <ul className="mt-6 space-y-2 text-sm">
          <li className="flex gap-2"><span aria-hidden>·</span> Share your basic profile and email</li>
          <li className="flex gap-2"><span aria-hidden>·</span> Read your Kani Estate orders and payment status</li>
          <li className="flex gap-2"><span aria-hidden>·</span> Subscribe / manage newsletter on your behalf</li>
        </ul>
        <p className="mt-5 text-xs text-muted-foreground">
          This does not bypass Kani Estate's permissions — every tool still runs as you, with the
          same access you already have.
        </p>

        {error && (
          <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>
        )}

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(true)}
            className="btn-estate disabled:opacity-60"
          >
            {busy ? "…" : "Approve"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => decide(false)}
            className="rounded-sm border border-border px-6 py-3.5 text-sm hover:bg-secondary transition disabled:opacity-60"
          >
            Cancel connection
          </button>
        </div>
      </div>
    </SiteLayout>
  );
}
