import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { imageFor } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";

const FREE_SHIP = 5000; // $50

export function CartDrawer() {
  const { isOpen, close, lines, setQty, subtotal, count } = useCart();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const toFreeShip = Math.max(0, FREE_SHIP - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIP) * 100);

  return (
    <>
      <div
        onClick={close}
        className={
          "fixed inset-0 z-50 bg-espresso/40 transition-opacity duration-300 " +
          (isOpen ? "opacity-100" : "opacity-0 pointer-events-none")
        }
      />
      <aside
        className={
          "fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background shadow-estate flex flex-col transition-transform duration-300 " +
          (isOpen ? "translate-x-0" : "translate-x-full")
        }
        aria-label="Cart"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <p className="eyebrow">Your basket</p>
            <p className="font-serif text-xl mt-1">{count} {count === 1 ? "item" : "items"}</p>
          </div>
          <button onClick={close} className="h-10 w-10 rounded-full hover:bg-secondary flex items-center justify-center" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {count > 0 && (
          <div className="px-6 py-4 border-b border-border">
            {toFreeShip > 0 ? (
              <p className="text-xs text-muted-foreground">
                Add <span className="text-foreground font-medium">{formatPrice(toFreeShip)}</span> more for complimentary shipping.
              </p>
            ) : (
              <p className="text-xs text-forest">Complimentary shipping unlocked.</p>
            )}
            <div className="mt-2 h-0.5 bg-muted overflow-hidden rounded-full">
              <div className="h-full bg-brass transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 font-serif text-xl">Your basket is empty</p>
              <p className="mt-2 text-sm text-muted-foreground">The estate awaits.</p>
              <Link to="/shop" onClick={close} className="mt-6 rounded-sm bg-primary px-6 py-3 text-sm text-primary-foreground hover:opacity-90">
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {lines.map((l) => (
                <li key={l.productId} className="py-5 flex gap-4">
                  <img
                    src={imageFor(l.image_key)}
                    alt={l.name}
                    className="h-20 w-20 rounded-sm object-cover bg-secondary"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base leading-tight">{l.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatPrice(l.price_cents)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="inline-flex items-center border border-border rounded-sm">
                        <button onClick={() => setQty(l.productId, l.quantity - 1)} className="h-8 w-8 flex items-center justify-center hover:bg-secondary" aria-label="Decrease">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{l.quantity}</span>
                        <button onClick={() => setQty(l.productId, l.quantity + 1)} className="h-8 w-8 flex items-center justify-center hover:bg-secondary" aria-label="Increase">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button onClick={() => setQty(l.productId, 0)} className="text-xs text-muted-foreground hover:text-destructive transition">
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="text-sm">{formatPrice(l.price_cents * l.quantity)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {count > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4">
            <div className="flex items-baseline justify-between">
              <p className="eyebrow">Subtotal</p>
              <p className="font-serif text-2xl">{formatPrice(subtotal)}</p>
            </div>
            <p className="text-xs text-muted-foreground">Tax and shipping calculated at checkout.</p>
            <Link
              to="/checkout"
              onClick={close}
              className="block w-full text-center rounded-sm bg-primary px-6 py-4 text-sm text-primary-foreground hover:opacity-90 transition"
            >
              Proceed to checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
