import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { useMemo } from "react";
import { fetchProducts, type Product } from "@/lib/products";
import { SiteLayout } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";

const searchSchema = z.object({
  category: z.enum(["coffee", "spice", "gift"]).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc"]).optional(),
});

const productsQO = queryOptions({
  queryKey: ["products", "all"],
  queryFn: fetchProducts,
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  head: () => ({
    meta: [
      { title: "Shop — Kani Estate" },
      { name: "description", content: "Single-origin coffees, heirloom spices and gift boxes from our family estate." },
      { property: "og:title", content: "Shop — Kani Estate" },
      { property: "og:description", content: "Small-lot coffee and heirloom spices, grown and cured on our estate." },
    ],
  }),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="container-estate py-32 text-center text-sm text-muted-foreground">Could not load shop: {error.message}</div>
    </SiteLayout>
  ),
  notFoundComponent: () => <div>Not found</div>,
  component: ShopPage,
});

function ShopPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const { data: products } = useSuspenseQuery(productsQO);

  const filtered = useMemo(() => {
    let list: Product[] = search.category
      ? products.filter((p) => p.category === search.category)
      : products;
    if (search.sort === "price-asc") list = [...list].sort((a, b) => a.price_cents - b.price_cents);
    else if (search.sort === "price-desc") list = [...list].sort((a, b) => b.price_cents - a.price_cents);
    return list;
  }, [products, search.category, search.sort]);

  const cats = [
    { key: undefined, label: "All" },
    { key: "coffee" as const, label: "Coffee" },
    { key: "spice" as const, label: "Spice" },
    { key: "gift" as const, label: "Gift" },
  ];

  return (
    <SiteLayout>
      <section className="container-estate pt-16 pb-10">
        <p className="eyebrow">Shop</p>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl">The estate catalogue</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Every lot is roasted or cured to order, then shipped within a week. Complimentary shipping on orders over ₹2,000.
        </p>
      </section>

      <section className="container-estate">
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-y border-border">
          <div className="flex flex-wrap gap-1">
            {cats.map((c) => {
              const active = search.category === c.key;
              return (
                <button
                  key={c.label}
                  onClick={() => navigate({ search: (s: z.infer<typeof searchSchema>) => ({ ...s, category: c.key }) })}
                  className={
                    "px-4 py-2 text-xs uppercase tracking-widest rounded-full transition " +
                    (active ? "bg-primary text-primary-foreground" : "hover:bg-secondary")
                  }
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <label htmlFor="shop-sort" className="text-muted-foreground uppercase tracking-widest">Sort</label>
            <select
              id="shop-sort"
              aria-label="Sort products"
              value={search.sort ?? "featured"}
              onChange={(e) =>
                navigate({ search: (s: z.infer<typeof searchSchema>) => ({ ...s, sort: e.target.value === "featured" ? undefined : (e.target.value as "price-asc" | "price-desc") }) })
              }
              className="bg-transparent border-b border-border py-1 focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price, low to high</option>
              <option value="price-desc">Price, high to low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-14 py-16">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {filtered.length === 0 && (
          <p className="py-24 text-center text-muted-foreground">No products in this category yet.</p>
        )}
      </section>
    </SiteLayout>
  );
}
