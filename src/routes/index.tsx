import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { fetchProducts, type Product } from "@/lib/products";
import { SiteLayout } from "@/components/site-layout";
import { ProductCard } from "@/components/product-card";
import hero from "@/assets/hero-estate.jpg";
import storyImg from "@/assets/story-hands.jpg";
import { ArrowRight } from "lucide-react";

const productsQO = queryOptions({
  queryKey: ["products", "all"],
  queryFn: fetchProducts,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  errorComponent: ({ error }) => (
    <SiteLayout>
      <div className="container-estate py-32 text-center">
        <p className="text-sm text-muted-foreground">Could not load the estate. {error.message}</p>
      </div>
    </SiteLayout>
  ),
  notFoundComponent: () => <div>Not found</div>,
  component: HomePage,
});

function HomePage() {
  const { data: products } = useSuspenseQuery(productsQO);
  const featured = products.filter((p: Product) => p.featured).slice(0, 4);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative -mt-20">
        <div className="relative h-[100vh] min-h-[640px] max-h-[900px] w-full overflow-hidden">
          <img
            src={hero}
            alt="Coffee cherries drying on wooden patios at Kani Estate at golden hour"
            className="absolute inset-0 h-full w-full object-cover"
            width={1920}
            height={1280}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-espresso/30 via-espresso/10 to-background" />
          <div className="relative z-10 h-full container-estate flex flex-col justify-end pb-20 md:pb-32">
            <div className="max-w-2xl rise-in">
              <p className="text-[11px] uppercase tracking-[0.3em] text-ivory/85">Finca Kani · Since 1890</p>
              <h1 className="mt-4 font-serif text-5xl md:text-7xl leading-[1.02] text-ivory">
                Coffee and spice, grown slowly.
              </h1>
              <p className="mt-6 max-w-lg text-base text-ivory/85 leading-relaxed">
                Four generations working the same hillsides in Huila. Every lot on this page was picked, dried and cured by hand on our estate.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/shop" className="inline-flex items-center gap-2 rounded-sm bg-ivory px-8 py-4 text-sm tracking-wide text-espresso hover:bg-brass hover:text-ivory transition">
                  Browse the shop <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/story" className="inline-flex items-center gap-2 rounded-sm border border-ivory/40 px-8 py-4 text-sm tracking-wide text-ivory hover:bg-ivory/10 transition">
                  Our story
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE / CREDENTIALS */}
      <section className="border-y border-border bg-secondary/40 py-8">
        <div className="container-estate grid grid-cols-2 md:grid-cols-4 gap-y-4 text-center">
          {[
            ["1,800 m", "Elevation"],
            ["4 gen.", "Family run"],
            ["48 hr", "Washed ferment"],
            ["Hand-picked", "Every cherry"],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="font-serif text-2xl">{v}</p>
              <p className="eyebrow mt-1 !text-[10px]">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container-estate py-24 md:py-32">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow">This season</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl">Featured lots</h2>
          </div>
          <Link to="/shop" className="hidden md:inline-flex items-center gap-2 text-sm hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-14">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* STORY */}
      <section className="bg-secondary/40 py-24 md:py-32">
        <div className="container-estate grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="order-2 md:order-1">
            <p className="eyebrow">The estate</p>
            <h2 className="mt-3 font-serif text-4xl md:text-5xl leading-tight">A patient way of working.</h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              We pick only ripe cherries — sometimes returning to the same tree six or seven times in a season. Coffee is fermented in mountain spring water, dried on raised patios, and rested for months before it ever meets a roaster.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Our spices are grown between the coffee, shaded by native cedars, and cured slowly in the highland air.
            </p>
            <Link to="/story" className="mt-8 inline-flex items-center gap-2 text-sm border-b border-foreground pb-1 hover:text-brass hover:border-brass transition">
              Read our story <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="order-1 md:order-2 aspect-[4/5] overflow-hidden">
            <img src={storyImg} alt="Hands holding freshly roasted coffee beans" className="h-full w-full object-cover" loading="lazy" width={1400} height={1600}/>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-estate py-24 md:py-32">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { to: "/shop", search: { category: "coffee" as const }, label: "Coffee", desc: "Small-lot single-origin, roasted weekly.", n: "01" },
            { to: "/shop", search: { category: "spice" as const }, label: "Spices", desc: "Heirloom peppers, cardamom, cinnamon.", n: "02" },
            { to: "/shop", search: { category: "gift" as const }, label: "Gift boxes", desc: "Curated introductions to the estate.", n: "03" },
          ].map((c) => (
            <Link key={c.label} to={c.to} search={c.search} className="group block border border-border p-8 hover:bg-secondary/50 transition">
              <p className="eyebrow">{c.n}</p>
              <h3 className="mt-6 font-serif text-3xl">{c.label}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{c.desc}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm">
                Shop <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
