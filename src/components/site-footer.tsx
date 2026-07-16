import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email });
    setPending(false);
    if (error && !error.message.includes("duplicate")) {
      toast.error("Could not subscribe. Try again.");
    } else {
      toast.success("Welcome to the estate.");
      setEmail("");
    }
  }

  return (
    <footer className="mt-32 border-t border-border bg-secondary/40">
      <div className="container-estate py-20 grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2 max-w-md">
          <p className="eyebrow">Newsletter</p>
          <h3 className="mt-3 font-serif text-3xl">Dispatches from the estate</h3>
          <p className="mt-3 text-sm text-muted-foreground">
            Harvest news, new lots, brewing notes. Four or five letters a year — no more.
          </p>
          <form onSubmit={subscribe} className="mt-6 flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-sm border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-primary px-6 py-3 text-sm text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "…" : "Subscribe"}
            </button>
          </form>
        </div>

        <div>
          <p className="eyebrow">Shop</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/shop" className="hover:underline">All products</Link></li>
            <li><Link to="/shop" search={{ category: "coffee" }} className="hover:underline">Coffee</Link></li>
            <li><Link to="/shop" search={{ category: "spice" }} className="hover:underline">Spices</Link></li>
            <li><Link to="/shop" search={{ category: "gift" }} className="hover:underline">Gift boxes</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow">Estate</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/story" className="hover:underline">Our story</Link></li>
            <li><Link to="/journal" className="hover:underline">Journal</Link></li>
            <li><Link to="/account" className="hover:underline">My account</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-estate py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Kani Estate. Grown, dried and cured on the family finca since 1890.</p>
          <p>Made with care in Huila, Colombia.</p>
        </div>
      </div>
    </footer>
  );
}
