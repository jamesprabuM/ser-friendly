import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-context";
import { formatPrice } from "@/lib/format";
import { imageFor } from "@/lib/product-images";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createRazorpayOrder, verifyRazorpayPayment } from "@/lib/razorpay.functions";

declare global {
  interface Window {
    Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
  }
}


export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Kani Estate" },
      { name: "description", content: "Complete your Kani Estate order — secure Razorpay checkout for single-origin coffee and heirloom spices, shipped across India." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    address: "",
    city: "",
    postal: "",
    country: "United States",
    notes: "",
  });

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: f.email || user.email! }));
  }, [user]);

  useEffect(() => {
    if (!loading && !user && lines.length > 0) {
      toast.info("Please sign in to complete your order.");
      navigate({ to: "/auth" });
    }
  }, [loading, user, lines.length, navigate]);

  const shipping = subtotal >= 200000 || subtotal === 0 ? 0 : 15000;
  const total = subtotal + shipping;

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!user || lines.length === 0) return;
    setBusy(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user.id,
        status: "pending",
        subtotal_cents: subtotal,
        shipping_cents: shipping,
        total_cents: total,
        ship_name: form.name,
        ship_email: form.email,
        ship_address: form.address,
        ship_city: form.city,
        ship_postal: form.postal,
        ship_country: form.country,
        notes: form.notes || null,
      }).select("id").single();
      if (error) throw error;

      const { error: itemsErr } = await supabase.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          product_id: l.productId,
          product_name: l.name,
          quantity: l.quantity,
          unit_price_cents: l.price_cents,
        })),
      );
      if (itemsErr) throw itemsErr;

      // Create Razorpay order
      const rzp = await createRazorpayOrder({ data: { orderId: order.id } });

      if (typeof window === "undefined" || !window.Razorpay) {
        toast.error("Payment library failed to load. Please refresh and try again.");
        setBusy(false);
        return;
      }

      const checkout = new window.Razorpay({
        key: rzp.key_id,
        amount: rzp.amount,
        currency: rzp.currency,
        name: "Kani Estate",
        description: "Single-origin coffee & spices",
        order_id: rzp.razorpay_order_id,
        prefill: { name: form.name, email: form.email },
        notes: { order_id: order.id },
        theme: { color: "#3a2a1a" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyRazorpayPayment({
              data: {
                orderId: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
            });
            clear();
            toast.success("Payment received. Thank you.");
            navigate({ to: "/checkout/thanks", search: { id: order.id } });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled. Your order is saved as pending.");
            setBusy(false);
          },
        },
      });
      checkout.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
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

  if (!user) return null;

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
                <Field label="Postal code" value={form.postal} onChange={(v) => update("postal", v)} required />
              </div>
              <Field label="Country" value={form.country} onChange={(v) => update("country", v)} required />
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Notes (optional)</span>
                <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2}
                  className="mt-2 w-full border-b border-border bg-transparent py-2 focus:outline-none focus:border-foreground resize-none" />
              </label>
            </fieldset>

            <div className="pt-6 border-t border-border space-y-3 text-sm">
              <p className="text-muted-foreground">
                Secure payment via Razorpay. Test mode is active — use card <span className="font-mono">4111 1111 1111 1111</span>, any future expiry, any CVV.
              </p>
              <button type="submit" disabled={busy}
                className="w-full rounded-sm bg-primary px-6 py-4 text-sm text-primary-foreground hover:opacity-90 transition disabled:opacity-50">
                {busy ? "Preparing payment…" : `Pay ${formatPrice(total)}`}
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
