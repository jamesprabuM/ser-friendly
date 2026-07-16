import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";
import storyImg from "@/assets/story-hands.jpg";
import hero from "@/assets/hero-estate.jpg";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Our Story — Kani Estate" },
      { name: "description", content: "Four generations on the same hillsides. The story of Finca Kani, our coffee, and our spices." },
      { property: "og:title", content: "Our Story — Kani Estate" },
      { property: "og:description", content: "Four generations on the same hillsides in Huila." },
    ],
  }),
  component: StoryPage,
});

function StoryPage() {
  return (
    <SiteLayout>
      <section className="relative -mt-20 h-[70vh] min-h-[500px] overflow-hidden">
        <img src={hero} alt="The estate at sunrise" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1280} />
        <div className="absolute inset-0 bg-espresso/50" />
        <div className="relative z-10 h-full container-estate flex items-end pb-20">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-ivory/85">Since 1890</p>
            <h1 className="mt-4 font-serif text-5xl md:text-7xl text-ivory">The story of Finca Kani</h1>
          </div>
        </div>
      </section>

      <article className="container-estate max-w-3xl py-24 space-y-10 text-lg leading-relaxed">
        <p className="font-serif text-3xl leading-snug">
          Our great-grandfather planted the first coffee trees on these hills in 1890, in the shade of native cedars that still stand today.
        </p>
        <p>
          Four generations later, we are still on the same land — 180 hectares of steep, misted hillside in Huila, Colombia, sitting at 1,800 metres. Every cherry on this site was picked by someone who lives on the estate.
        </p>

        <img src={storyImg} alt="Freshly roasted beans" className="w-full aspect-[4/3] object-cover my-16" loading="lazy" width={1400} height={1600} />

        <h2 className="font-serif text-3xl">Slowly, deliberately.</h2>
        <p>
          Ripe cherries are hand-picked, sometimes six or seven passes through the same rows in a season. Coffee is fermented in mountain spring water for 48 hours, then dried on raised patios for another twelve days, turned by hand every three hours.
        </p>
        <p>
          Between the coffee, in the same cedar shade, we grow cardamom, black pepper, cinnamon and vanilla. They are cured the same way — slowly, in highland air, until they are ready.
        </p>

        <h2 className="font-serif text-3xl mt-16">What we do not do.</h2>
        <p>
          We do not spray. We do not mechanise the harvest. We do not sell to blenders. We do not roast anything more than a week before it ships. What lands at your door is what came off our hillside — nothing added, nothing rushed.
        </p>

        <div className="mt-16 border-t border-border pt-10 text-center">
          <Link to="/shop" className="inline-flex items-center rounded-sm bg-primary px-8 py-4 text-sm text-primary-foreground hover:opacity-90 transition">
            Visit the shop
          </Link>
        </div>
      </article>
    </SiteLayout>
  );
}
