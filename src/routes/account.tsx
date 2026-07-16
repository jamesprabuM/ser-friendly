import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — Kani Estate" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_cents: number;
  items: { name: string; quantity: number }[] | null;
}

function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: orders } = useQuery({
    queryKey: ["orders", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, status, total_cents, items")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  if (!user) return null;

  return (
    <SiteLayout>
      <div className="container-estate py-16 max-w-4xl">
        <p className="eyebrow">Your account</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <h1 className="font-serif text-4xl md:text-5xl">Hello, {user.email?.split("@")[0]}.</h1>
          <button onClick={() => signOut().then(() => navigate({ to: "/" }))} className="text-sm underline">
            Sign out
          </button>
        </div>

        <section className="mt-16">
          <h2 className="font-serif text-2xl">Recent orders</h2>
          <div className="mt-6 border-t border-border">
            {!orders || orders.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <p>No orders yet.</p>
                <Link to="/shop" className="mt-4 inline-block underline text-foreground">Visit the shop</Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {orders.map((o) => (
                  <li key={o.id} className="py-6 flex flex-wrap items-center gap-6 justify-between">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                      <p className="mt-1 text-sm">{new Date(o.created_at).toLocaleDateString()}</p>
                      {o.items && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="eyebrow">{o.status}</p>
                      <p className="mt-1 font-serif text-lg">{formatPrice(o.total_cents)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
