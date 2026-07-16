import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/checkout/thanks")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Thank you — Kani Estate" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThanksPage,
});

function ThanksPage() {
  const { id } = Route.useSearch();
  return (
    <SiteLayout>
      <div className="container-estate py-32 max-w-xl text-center">
        <p className="eyebrow">Order confirmed</p>
        <h1 className="mt-4 font-serif text-5xl">Thank you.</h1>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          Your order is with us. We'll roast, pack and ship it within the week, and send a note when it's on its way.
        </p>
        {id && <p className="mt-6 font-mono text-xs text-muted-foreground">Reference #{id.slice(0, 8)}</p>}
        <div className="mt-12 flex justify-center gap-3">
          <Link to="/shop" className="rounded-sm bg-primary px-8 py-3.5 text-sm text-primary-foreground hover:opacity-90 transition">
            Continue shopping
          </Link>
          <Link to="/account" className="rounded-sm border border-border px-8 py-3.5 text-sm hover:bg-secondary transition">
            View account
          </Link>
        </div>
      </div>
    </SiteLayout>
  );
}
