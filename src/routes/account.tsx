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
      { name: "description", content: "Your Kani Estate account — review order history, payment status and shipment updates for your single-origin coffee and spice orders." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/account" }],
  }),
  component: AccountPage,
});

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_cents: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  paid_at: string | null;
  order_items: { product_name: string; quantity: number }[] | null;
}

function paymentBadge(status: string, paidAt: string | null) {
  const paid = status === "paid" || !!paidAt;
  if (paid) return { label: "Paid", cls: "bg-[color:var(--forest)]/10 text-[color:var(--forest)] border-[color:var(--forest)]/30" };
  if (status === "failed" || status === "cancelled")
    return { label: status === "failed" ? "Failed" : "Cancelled", cls: "bg-destructive/10 text-destructive border-destructive/30" };
  return { label: "Awaiting payment", cls: "bg-muted text-muted-foreground border-border" };
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
        .select("id, created_at, status, total_cents, razorpay_order_id, razorpay_payment_id, paid_at, order_items(product_name, quantity)")
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
                {orders.map((o) => {
                  const badge = paymentBadge(o.status, o.paid_at);
                  return (
                    <li key={o.id} className="py-6 flex flex-wrap items-start gap-6 justify-between">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                        <p className="mt-1 text-sm">{new Date(o.created_at).toLocaleDateString()}</p>
                        {o.order_items && o.order_items.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {o.order_items.map((i) => `${i.quantity}× ${i.product_name}`).join(", ")}
                          </p>
                        )}
                        <dl className="mt-3 space-y-1 text-xs">
                          {o.razorpay_payment_id ? (
                            <div className="flex gap-2">
                              <dt className="text-muted-foreground">Payment ref</dt>
                              <dd className="font-mono break-all">{o.razorpay_payment_id}</dd>
                            </div>
                          ) : o.razorpay_order_id ? (
                            <div className="flex gap-2">
                              <dt className="text-muted-foreground">Razorpay order</dt>
                              <dd className="font-mono break-all">{o.razorpay_order_id}</dd>
                            </div>
                          ) : null}
                          {o.paid_at && (
                            <div className="flex gap-2">
                              <dt className="text-muted-foreground">Paid on</dt>
                              <dd>{new Date(o.paid_at).toLocaleString()}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider ${badge.cls}`}>
                          {badge.label}
                        </span>
                        <p className="mt-2 font-serif text-lg">{formatPrice(o.total_cents)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
