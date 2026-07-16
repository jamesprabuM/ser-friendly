import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingBag, User as UserIcon, Menu, X, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { count, open } = useCart();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const nav = [
    { to: "/shop", label: "Shop" },
    { to: "/story", label: "Our Story" },
    { to: "/journal", label: "Journal" },
  ] as const;

  return (
    <header
      className={
        "sticky top-0 z-40 transition-all duration-300 " +
        (scrolled
          ? "backdrop-blur-md bg-background/85 border-b border-border"
          : "bg-transparent border-b border-transparent")
      }
    >
      <div className="container-estate flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-serif text-2xl tracking-tight">Kani</span>
          <span className="eyebrow !text-[10px]">Estate</span>
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm tracking-wide text-foreground/80 hover:text-foreground transition"
              activeProps={{ className: "text-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition"
              aria-label="Admin"
              title="Admin"
            >
              <ShieldCheck className="h-4 w-4" />
            </Link>
          )}
          <Link
            to={user ? "/account" : "/auth"}
            className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition"
            aria-label="Account"
          >
            <UserIcon className="h-4 w-4" />
          </Link>
          <button
            onClick={open}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition"
            aria-label="Open cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-medium text-accent-foreground">
                {count}
              </span>
            )}
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary transition"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container-estate py-6 flex flex-col gap-4">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} className="font-serif text-2xl">
                {n.label}
              </Link>
            ))}
            <Link to={user ? "/account" : "/auth"} className="font-serif text-2xl">
              {user ? "Account" : "Sign in"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
