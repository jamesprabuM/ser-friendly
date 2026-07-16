import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site-layout";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal — Kani Estate" },
      { name: "description", content: "Field notes from the estate — harvests, brewing, and cellar work." },
      { property: "og:title", content: "Journal — Kani Estate" },
      { property: "og:description", content: "Field notes from the estate." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "https://ser-friendly.lovable.app/journal" },
    ],
    links: [{ rel: "canonical", href: "/journal" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          name: "Kani Estate Journal",
          description: "Field notes from Kani Estate — harvests, brewing, and cellar work.",
          url: "https://ser-friendly.lovable.app/journal",
        }),
      },
    ],
  }),
  component: JournalPage,
});

const entries = [
  { title: "Notes on the 2026 washed harvest", excerpt: "A warmer January, a slower fermentation. What it means for the medium roast.", date: "March 2026", read: "6 min" },
  { title: "Cardamom, and why we cure it slow", excerpt: "Ten days in highland air, or ten hours in a kiln. The difference is everything.", date: "January 2026", read: "4 min" },
  { title: "Brewing our light roast at home", excerpt: "A pour-over recipe from our head roaster: 15 g in, 250 g out, 3:30 total.", date: "November 2025", read: "3 min" },
  { title: "Between the trees: growing spices in cedar shade", excerpt: "How the same shade that shelters our coffee makes for better pepper.", date: "September 2025", read: "5 min" },
];

function JournalPage() {
  return (
    <SiteLayout>
      <section className="container-estate pt-16 pb-10">
        <p className="eyebrow">Journal</p>
        <h1 className="mt-3 font-serif text-5xl md:text-6xl">Field notes</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Occasional writing from the estate — harvests, cellar work, and the way we brew at home.
        </p>
      </section>

      <section className="container-estate">
        <ul className="divide-y divide-border border-y border-border">
          {entries.map((e) => (
            <li key={e.title} className="py-10 grid md:grid-cols-[1fr_2fr] gap-6 hover:bg-secondary/30 transition -mx-6 px-6">
              <div>
                <p className="eyebrow">{e.date}</p>
                <p className="text-xs text-muted-foreground mt-2">{e.read} read</p>
              </div>
              <div>
                <h2 className="font-serif text-2xl md:text-3xl">{e.title}</h2>
                <p className="mt-3 text-muted-foreground">{e.excerpt}</p>
                <span className="mt-4 inline-block text-xs uppercase tracking-widest border-b border-foreground pb-0.5">Read soon</span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-16 text-center">
          <Link to="/" className="text-sm underline">Back to the estate</Link>
        </div>
      </section>
    </SiteLayout>
  );
}
