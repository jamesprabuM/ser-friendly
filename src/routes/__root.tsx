import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">Not found</p>
        <h1 className="mt-4 font-serif text-6xl">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This page has wandered off the estate.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-sm bg-primary px-6 py-3 text-sm font-medium tracking-wide text-primary-foreground transition hover:opacity-90"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something broke</p>
        <h1 className="mt-4 font-serif text-3xl">This page didn't load</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Try again in a moment, or head back to the estate.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-sm bg-primary px-6 py-3 text-sm text-primary-foreground transition hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-sm border border-input px-6 py-3 text-sm transition hover:bg-secondary"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kani Estate — Single-Origin Coffee & Spices" },
      { name: "description", content: "Small-lot coffee and heirloom spices, grown, dried and cured on our family estate since 1890." },
      { property: "og:title", content: "Kani Estate — Single-Origin Coffee & Spices" },
      { property: "og:description", content: "Small-lot coffee and heirloom spices, grown, dried and cured on our family estate since 1890." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Kani Estate — Single-Origin Coffee & Spices" },
      { name: "twitter:description", content: "Small-lot coffee and heirloom spices, grown, dried and cured on our family estate since 1890." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f61a749a-6908-4c43-b538-e97e47d972d5/id-preview-bd4b287a--c9126629-966f-4129-b0f1-0acd11509821.lovable.app-1784200106720.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f61a749a-6908-4c43-b538-e97e47d972d5/id-preview-bd4b287a--c9126629-966f-4129-b0f1-0acd11509821.lovable.app-1784200106720.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
    scripts: [
      { src: "https://checkout.razorpay.com/v1/checkout.js", defer: true },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Kani Estate",
          url: "https://ser-friendly.lovable.app",
          description: "Small-lot single-origin coffee and heirloom spices, grown and cured on our family estate since 1890.",
          foundingDate: "1890",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Kani Estate",
          url: "https://ser-friendly.lovable.app",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Outlet />
          <Toaster position="bottom-right" richColors />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
