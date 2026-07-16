# Kani Estate

A warm-editorial e-commerce storefront for single-origin coffee and spices, built with TanStack Start and Lovable Cloud.

## Preview

Watch a quick walkthrough of the storefront, catalog, and journal pages:

https://github.com/user-attachments/assets/REPLACE_WITH_VIDEO_URL

> Replace the link above with the GitHub-hosted URL of `kani-preview.mp4` after uploading it to the repository. To get the URL, open the README editor on GitHub and drag the video file into the markdown area — GitHub will auto-generate a playable link.

## Features

- Editorial landing page with featured products and journal strip
- Product catalog with filtering, sorting, and search
- Product detail pages with tasting notes and origin details
- Client-side cart with localStorage persistence
- Razorpay checkout integration (test mode)
- Account dashboard with order history and payment status
- Admin dashboard for product and order management
- Newsletter subscription
- MCP server with OAuth-protected tools

## Tech Stack

- **Framework:** TanStack Start v1
- **Styling:** Tailwind CSS v4 with custom OKLCH design tokens
- **Backend:** Lovable Cloud (Supabase)
- **Payments:** Razorpay
- **Auth:** Email/password + Google OAuth

## Getting Started

```bash
bun install
bun run dev
```

## Scripts

- `bun run dev` — Start the development server
- `bun run build` — Build for production
- `bun run test` — Run the test suite
- `bun run lint` — Run linting

## Environment Variables

The following variables are required for production builds:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
