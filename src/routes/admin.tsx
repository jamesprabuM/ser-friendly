import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/site-layout";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { getAdminOverview } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Kani Estate" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "orders" | "products" | "subscribers" | "users";

function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");
  const [expanded, setExpanded] = useState<string | null>(null);
  const fetchOverview = useServerFn(getAdminOverview);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-overview", user?.id],
    enabled: !!user,
    queryFn: () => fetchOverview(),
  });

  if (!user) return null;

  if (error) {
    const forbidden = /forbidden/i.test(String((error as Error).message));
    return (
      <SiteLayout>
        <div className="container-estate py-24 max-w-2xl text-center">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-3 font-serif text-4xl">
            {forbidden ? "You don't have access" : "Something went wrong"}
          </h1>
          <p className="mt-4 text-muted-foreground">
            {forbidden
              ? "This area is reserved for estate administrators."
              : (error as Error).message}
          </p>
          <Link to="/" className="mt-8 inline-block underline">Return home</Link>
        </div>
      </SiteLayout>
    );
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders", count: data?.totals.orders },
    { id: "products", label: "Products", count: data?.totals.products },
    { id: "subscribers", label: "Subscribers", count: data?.totals.subscribers },
    { id: "users", label: "Users", count: data?.totals.users },
  ];

  return (
    <SiteLayout>
      <div className="container-estate py-16 max-w-6xl">
        <p className="eyebrow">Estate admin</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Dashboard</h1>
        <p className="mt-2 text-muted-foreground text-sm">Signed in as {user.email}</p>

        <nav className="mt-10 flex flex-wrap gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "relative px-4 py-3 text-sm transition -mb-px border-b-2 " +
                (tab === t.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t.label}
              {typeof t.count === "number" && (
                <span className="ml-2 text-xs text-muted-foreground">{t.count}</span>
              )}
            </button>
          ))}
        </nav>

        {isLoading || !data ? (
          <div className="py-24 text-center text-muted-foreground">Loading estate data…</div>
        ) : (
          <div className="mt-10">
            {tab === "overview" && <Overview data={data} />}
            {tab === "orders" && (
              <Orders data={data} expanded={expanded} setExpanded={setExpanded} />
            )}
            {tab === "products" && <Products data={data} />}
            {tab === "subscribers" && <Subscribers data={data} />}
            {tab === "users" && <Users data={data} />}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-border rounded-md p-5 bg-card">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function StatusBadge({ status, paidAt }: { status: string; paidAt: string | null }) {
  const paid = status === "paid" || !!paidAt;
  let cls = "bg-muted text-muted-foreground border-border";
  let label: string = status;
  if (paid) {
    cls = "bg-[color:var(--forest)]/10 text-[color:var(--forest)] border-[color:var(--forest)]/30";
    label = "Paid";
  } else if (status === "failed" || status === "cancelled") {
    cls = "bg-destructive/10 text-destructive border-destructive/30";
  } else {
    label = "Pending";
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}

function Overview({ data }: { data: import("@/lib/admin.functions").AdminOverview }) {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Revenue" value={formatPrice(data.totals.revenue_cents)} hint="From paid orders" />
        <Stat label="Orders" value={String(data.totals.orders)} hint={`${data.totals.paid_orders} paid · ${data.totals.pending_orders} pending`} />
        <Stat label="Products" value={String(data.totals.products)} />
        <Stat label="Customers" value={String(data.totals.users)} hint={`${data.totals.subscribers} subscribers`} />
      </div>

      <section>
        <h2 className="font-serif text-2xl">Latest orders</h2>
        <div className="mt-4 border-t border-border">
          {data.recent_orders.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.recent_orders.slice(0, 5).map((o) => (
                <li key={o.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                    <p className="mt-1 text-sm">{o.ship_name} · {o.ship_city}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={o.status} paidAt={o.paid_at} />
                    <p className="mt-1 font-serif text-lg">{formatPrice(o.total_cents)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}


function Orders({
  data,
  expanded,
  setExpanded,
}: {
  data: import("@/lib/admin.functions").AdminOverview;
  expanded: string | null;
  setExpanded: (v: string | null) => void;
}) {
  if (data.recent_orders.length === 0) {
    return <p className="py-8 text-sm text-muted-foreground">No orders yet.</p>;
  }
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="hidden md:grid grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
        <span>Order</span>
        <span>Customer</span>
        <span>Date</span>
        <span>Status</span>
        <span className="text-right">Total</span>
      </div>
      <ul className="divide-y divide-border">
        {data.recent_orders.map((o) => {
          const isOpen = expanded === o.id;
          return (
            <li key={o.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : o.id)}
                className="w-full text-left px-5 py-4 md:grid md:grid-cols-[1fr_1.4fr_1fr_1fr_auto] gap-4 items-center hover:bg-muted/30 transition"
              >
                <span className="font-mono text-xs">#{o.id.slice(0, 8)}</span>
                <span className="block md:inline mt-1 md:mt-0 text-sm">
                  {o.ship_name}
                  <span className="block text-xs text-muted-foreground">{o.ship_email}</span>
                </span>
                <span className="block md:inline mt-1 md:mt-0 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString()}
                </span>
                <span className="block md:inline mt-2 md:mt-0"><StatusBadge status={o.status} paidAt={o.paid_at} /></span>
                <span className="block md:inline mt-1 md:mt-0 md:text-right font-serif text-lg">{formatPrice(o.total_cents)}</span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 bg-muted/20 border-t border-border">
                  <div className="grid md:grid-cols-2 gap-6 pt-4 text-sm">
                    <div>
                      <p className="eyebrow">Payment</p>
                      <dl className="mt-2 space-y-1 text-xs">
                        <Row k="Status" v={o.status} />
                        <Row k="Paid at" v={o.paid_at ? new Date(o.paid_at).toLocaleString() : "—"} />
                        <Row k="Razorpay order" v={o.razorpay_order_id ?? "—"} mono />
                        <Row k="Razorpay payment" v={o.razorpay_payment_id ?? "—"} mono />
                      </dl>
                    </div>
                    <div>
                      <p className="eyebrow">Shipping</p>
                      <dl className="mt-2 space-y-1 text-xs">
                        <Row k="Name" v={o.ship_name} />
                        <Row k="Email" v={o.ship_email} />
                        <Row k="City" v={o.ship_city} />
                      </dl>
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="eyebrow">Items</p>
                    <ul className="mt-2 divide-y divide-border border-t border-border">
                      {o.items.map((it, idx) => (
                        <li key={idx} className="py-2 flex justify-between text-sm">
                          <span>{it.quantity}× {it.product_name}</span>
                          <span className="text-muted-foreground">{formatPrice(it.unit_price_cents * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <dt className="w-32 shrink-0 text-muted-foreground">{k}</dt>
      <dd className={mono ? "font-mono break-all" : "break-all"}>{v}</dd>
    </div>
  );
}

function Products({ data }: { data: import("@/lib/admin.functions").AdminOverview }) {
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
        <span>Product</span>
        <span>Category</span>
        <span>Price</span>
        <span>Stock</span>
        <span>Status</span>
      </div>
      <ul className="divide-y divide-border">
        {data.products.map((p) => (
          <li key={p.id} className="px-5 py-4 md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 items-center">
            <div>
              <p className="text-sm">{p.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{p.slug}</p>
            </div>
            <span className="text-sm capitalize">{p.category}</span>
            <span className="font-serif">{formatPrice(p.price_cents)}</span>
            <span className={"text-sm " + (p.stock < 10 ? "text-destructive" : "")}>{p.stock}</span>
            <span className="flex gap-2 flex-wrap">
              {p.published ? (
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[color:var(--forest)]/30 text-[color:var(--forest)] bg-[color:var(--forest)]/10">Live</span>
              ) : (
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-border text-muted-foreground">Draft</span>
              )}
              {p.featured && (
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-accent/40 text-accent-foreground bg-accent/10">Featured</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Subscribers({ data }: { data: import("@/lib/admin.functions").AdminOverview }) {
  if (data.subscribers.length === 0) {
    return <p className="py-8 text-sm text-muted-foreground">No newsletter subscribers yet.</p>;
  }
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <ul className="divide-y divide-border">
        {data.subscribers.map((s) => (
          <li key={s.id} className="px-5 py-3 flex justify-between text-sm">
            <span>{s.email}</span>
            <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Users({ data }: { data: import("@/lib/admin.functions").AdminOverview }) {
  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
        <span>Email</span>
        <span>Joined</span>
        <span>Last sign-in</span>
        <span>Role</span>
      </div>
      <ul className="divide-y divide-border">
        {data.users.map((u) => (
          <li key={u.id} className="px-5 py-3 md:grid md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center text-sm">
            <span className="break-all">{u.email ?? "—"}</span>
            <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span>
            <span className="text-xs text-muted-foreground">
              {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "Never"}
            </span>
            <span>
              {u.is_admin ? (
                <span className="text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-accent/40 text-accent-foreground bg-accent/10">Admin</span>
              ) : (
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Customer</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
