# Kani Estate — Full Store with Real Backend

A professional, warm-editorial single-origin coffee & spice e-commerce site, rebuilt on TanStack Start with Lovable Cloud as the backend.

## Design system (warm editorial estate)

- Palette (oklch tokens in `src/styles.css`): cream/ivory background, deep espresso ink, forest green accent, warm brass highlight, soft clay for secondary surfaces.
- Type: serif display (Fraunces) for headings, clean humanist sans (Inter) for body — loaded via `<link>` in `__root.tsx`.
- Motion: gentle fade/rise on scroll, subtle image zoom on hover, sticky translucent header on scroll.
- Custom shadcn variants (`hero`, `estate`, `ghost-serif`) so components never receive raw color classes.
- Generated hero + lifestyle imagery for landing; per-product imagery generated as tasteful placeholders.

## Pages / routes

```
/                     Landing: hero, story teaser, featured products, journal strip, newsletter
/shop                 Catalog: filters (category, roast, price), search, sort
/product/$slug        PDP: gallery, tasting notes, origin, add-to-cart, related
/cart                 Cart review
/checkout             3-step: shipping → payment → review (real Stripe checkout)
/account              Order history, profile (auth-gated)
/orders/$id           Order detail (auth-gated)
/story                Estate story / provenance page
/journal              Simple editorial index (static entries)
/auth                 Sign in / sign up (email+password, Google)
/reset-password       Password reset landing
```

Plus `sitemap.xml`, `robots.txt`, each route with unique head() metadata.

## Backend (Lovable Cloud)

Tables (RLS + GRANTs):
- `profiles` — auto-created on signup (trigger)
- `user_roles` + `has_role()` — admin role for future admin surface
- `products` — slug, name, category, roast, price_cents, description, tasting_notes, origin, image_url, stock, featured, published
- `product_images` — extra gallery images
- `orders` — user_id, status, total_cents, shipping_json, stripe_session_id
- `order_items` — order_id, product_id, qty, unit_price_cents

Anonymous SELECT policy on published products only. Order tables locked to owner via `auth.uid()`.

Seeded with 10–12 believable single-origin coffee & spice SKUs (migration INSERTs) with generated imagery.

## Cart

- Client cart in `localStorage` (guests can browse & add).
- On checkout, requires sign-in, then creates a Stripe Checkout Session via a server function.

## Payments

- Enable Lovable's built-in Stripe payments (`enable_stripe_payments`). Test mode by default; user verifies to go live.
- `create-checkout` server fn builds line items from cart + DB prices (never trust client prices).
- `/api/public/webhooks/stripe` server route verifies signature and writes the order + items with `supabaseAdmin`.
- `/checkout/success?session_id=…` polls the order until the webhook lands.

## Auth

- Email/password + Google (via `lovable.auth.signInWithOAuth("google", …)`).
- `_authenticated/` layout gates `/account`, `/orders/*`, `/checkout`.
- Password reset flow with `/reset-password` page.

## Build order

1. Design tokens + fonts + shadcn variants.
2. Generate hero + product imagery.
3. Enable Lovable Cloud; migrations for schema, RLS, seed data.
4. Landing + Shop + PDP (public, SSR, unique head metadata).
5. Auth + protected layout + account pages.
6. Cart + Stripe checkout + webhook + success page.
7. Story + Journal + sitemap/robots.
8. Verify: build, run through cart → test-mode checkout with Playwright.

## Clarifications before I start

1. **Payments**: OK to enable Lovable's built-in Stripe payments (test mode is free, no card; going live needs your Stripe verification)? If you'd rather ship without checkout for now, I'll stub it as "Coming soon" and skip Stripe setup.
2. **Newsletter signup**: real (store in DB, ready to wire to Resend/etc. later) or purely decorative?
3. **Admin panel** to manage products from the UI, or is DB-seeded catalog fine for v1?

Answer any of those inline (or say "your call") and I'll build.