import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { imageFor } from "@/lib/product-images";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Kani Estate" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: user?.email ?? "",
    name: "",
    address: "",
    city: "",
    zip: "",
    country: "United States",
  });

  const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 800;
  const total = subtotal + shipping;

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (lines.length === 0) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.from("orders").insert({
        user_id: user?.id ?? null,
        email: form.email,
        status: "pending",
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        total_cents: total,
        shipping_address: {
          name: form.name, address: form.address, city: form.city, zip: form.zip, country: form.country,
        },
        items: lines.map((l) => ({
          product_id: l.productId, name: l.name, quantity: l.quantity, price_cents: l.price_cents,
        })),
      }).select("id").single();
      if (error) throw error;
      clear();
      toast.success("Order placed. A confirmation is on its way.");
      navigate({ to: "/checkout/thanks", search: { id: data.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  if (lines.length === 0) {
    return (
      <SiteLayout>
        <div className="container-estate py-32 text-center">
          <p className="eyebrow">Empty basket</p>
          <h1 className="mt-3 font-serif text-4xl">Nothing to check out yet.</h1>
          <Link to="/shop" className="mt-8 inline-block rounded-sm bg-primary px-8 py-3.5 text-sm text-primary-foreground hover:opacity-90 transition">
            Visit the shop
          </Link>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container-estate py-16 max-w-6xl">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-3 font-serif text-4xl md:text-5xl">Complete your order</h1>

        <div className="mt-12 grid lg:grid-cols-[1.3fr_1fr] gap-12">
          <form onSubmit={placeOrder} className="space-y-10">
            <fieldset className="space-y-4">
              <legend className="eyebrow mb-2">Contact</legend>
              <Field label="Email" value={form.email} onChange={(v) => update("email", v)} type="email" required />
            </fieldset>
            <fieldset className="space-y-4">
              <legend className="eyebrow mb-2">Shipping</legend>
              <Field label="Full name" value={form.name} onChange={(v) => update("name", v)} required />
              <Field label="Street address" value={form.address} onChange={(v) => update("address", v)} required />
              <div className="grid grid-cols-2 gap-4">
                <Field label="City" value={form.city} onChange={(v) => update("city", v)} required />
                <Field label="ZIP / Postal" value={form.zip} onChange={(v) => update("zip", v)} required />
              </div>
              <Field label="Country" value={form.country} onChange={(v) => update("country", v)} required />
            </fieldset>

            <div className="pt-6 border-t border-border space-y-3 text-sm">
              <p className="text-muted-foreground">
                This is a demo checkout. Payments are not charged; your order is recorded in your account.
              </p>
              <button type="submit" disabled={busy}
                className="w-full rounded-sm bg-primary px-6 py-4 text-sm text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
                {busy ? "Placing order…" : `Place order · ${formatPrice(total)}`}
              </button>
            </div>
          </form>

          <aside className="bg-secondary/40 border border-border p-8 h-fit lg:sticky lg:top-28">
            <p className="eyebrow">Order summary</p>
            <ul className="mt-6 space-y-4">
              {lines.map((l) => (
                <li key={l.productId} className="flex gap-4">
                  <img src={imageFor(l.image_key)} alt={l.name} className="h-16 w-16 object-cover" />
                  <div className="flex-1 text-sm">
                    <p className="font-serif">{l.name}</p>
                    <p className="text-muted-foreground text-xs mt-1">Qty {l.quantity}</p>
                  </div>
                  <p className="text-sm">{formatPrice(l.price_cents * l.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-8 space-y-2 border-t border-border pt-6 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd></div>
              <div className="flex justify-between font-serif text-lg pt-3 border-t border-border">
                <dt>Total</dt><dd>{formatPrice(total)}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({ label, value, onChange, type = "text", required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground" />
    </label>
  );
}
