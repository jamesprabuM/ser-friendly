import { Link } from "@tanstack/react-router";
import { imageFor } from "@/lib/product-images";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={imageFor(product.image_key)}
          alt={`${product.name} — single-origin ${product.category} from ${product.origin ?? "Kani Estate"}`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          width={900}
          height={900}
        />
        {product.roast && product.roast !== "none" && (
          <span className="absolute top-4 left-4 rounded-full bg-background/90 px-3 py-1 text-[10px] uppercase tracking-widest">
            {product.roast} roast
          </span>
        )}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{product.origin ?? "Estate"}</p>
          <h3 className="mt-1 font-serif text-lg leading-tight">{product.name}</h3>
        </div>
        <p className="font-serif text-lg whitespace-nowrap">{formatPrice(product.price_cents)}</p>
      </div>
    </Link>
  );
}
