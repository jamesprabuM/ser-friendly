import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchProductBySlug, fetchProducts } from "@/lib/products";
import { SiteLayout } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";
import { imageFor } from "@/lib/product-images";
import { formatPrice, categoryLabel } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

const productQO = (slug: string) => queryOptions({
  queryKey: ["product", slug],
  queryFn: () => fetchProductBySlug(slug),
});
const allQO = queryOptions({
  queryKey: ["products", "all"],
  queryFn: fetchProducts,
});

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQO(params.slug));
    if (!product) throw notFound();
    context.queryClient.ensureQueryData(allQO);
    return product;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Not found" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${loaderData.name} — Kani Estate` },
        { name: "description", content: loaderData.short_description ?? "Single-origin from Kani Estate." },
        { property: "og:title", content: `${loaderData.name} — Kani Estate` },
        { property: "og:description", content: loaderData.short_description ?? "Single-origin from Kani Estate." },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="container-estate py-32 text-center text-sm text-muted-foreground">Could not load product: {error.message}</div>
    </SiteLayout>
  ),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="container-estate py-32 text-center">
        <p className="eyebrow">Not found</p>
        <h1 className="mt-3 font-serif text-4xl">This product isn't on the estate</h1>
        <Link to="/shop" className="mt-8 inline-block underline">Return to the shop</Link>
      </div>
    </SiteLayout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const params = Route.useParams();
  const { data: product } = useSuspenseQuery(productQO(params.slug));
  const { data: all } = useSuspenseQuery(allQO);
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!product) return null;

  const related = all.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 3);

  function addToBag() {
    if (!product) return;
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price_cents: product.price_cents,
      image_key: product.image_key,
    }, qty);
    toast.success(`${qty} × ${product.name} added`);
  }

  return (
    <SiteLayout>
      <div className="container-estate pt-10 pb-24">
        <nav className="text-xs text-muted-foreground mb-8">
          <Link to="/shop" className="hover:underline">Shop</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" search={{ category: product.category }} className="hover:underline">{categoryLabel(product.category)}</Link>
          <span className="mx-2">/</span>
          <span>{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          <div className="aspect-square overflow-hidden bg-secondary">
            <img src={imageFor(product.image_key)} alt={product.name} className="h-full w-full object-cover" width={900} height={900} />
          </div>

          <div className="md:pt-6">
            <p className="eyebrow">{categoryLabel(product.category)}{product.origin ? ` · ${product.origin}` : ""}</p>
            <h1 className="mt-4 font-serif text-4xl md:text-5xl leading-tight">{product.name}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{product.short_description}</p>

            <div className="mt-8 flex items-baseline gap-4">
              <p className="font-serif text-3xl">{formatPrice(product.price_cents)}</p>
              {product.weight && <p className="text-sm text-muted-foreground">{product.weight}</p>}
            </div>

            {product.tasting_notes && product.tasting_notes.length > 0 && (
              <div className="mt-8">
                <p className="eyebrow">Tasting notes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.tasting_notes.map((t) => (
                    <span key={t} className="rounded-full border border-border px-3 py-1 text-xs">{t}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-10 flex items-center gap-4">
              <div className="inline-flex items-center border border-border rounded-sm">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-12 w-12 flex items-center justify-center hover:bg-secondary" aria-label="Decrease">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="h-12 w-12 flex items-center justify-center hover:bg-secondary" aria-label="Increase">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button onClick={addToBag} className="flex-1 rounded-sm bg-primary px-8 py-4 text-sm text-primary-foreground hover:opacity-90 transition">
                Add to basket · {formatPrice(product.price_cents * qty)}
              </button>
            </div>

            <div className="mt-12 space-y-6 border-t border-border pt-8">
              <div>
                <p className="eyebrow">Description</p>
                <p className="mt-3 leading-relaxed">{product.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest">Origin</p>
                  <p className="mt-1">{product.origin ?? "Kani Estate"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-widest">Weight</p>
                  <p className="mt-1">{product.weight ?? "—"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-32">
            <p className="eyebrow">You may also like</p>
            <h2 className="mt-3 font-serif text-3xl">From the same shelf</h2>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}
