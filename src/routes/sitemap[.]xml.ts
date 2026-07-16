import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://ser-friendly.lovable.app";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries = [
          { path: "/", priority: "1.0", changefreq: "weekly" },
          { path: "/shop", priority: "0.9", changefreq: "daily" },
          { path: "/story", priority: "0.7", changefreq: "monthly" },
          { path: "/journal", priority: "0.6", changefreq: "weekly" },
        ];

        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_PUBLISHABLE_KEY;
        let productPaths: string[] = [];
        if (url && key) {
          try {
            const client = createClient(url, key, {
              auth: { persistSession: false, autoRefreshToken: false },
              global: {
                fetch: (input, init) => {
                  const h = new Headers(init?.headers);
                  if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
                  h.set("apikey", key);
                  return fetch(input, { ...init, headers: h });
                },
              },
            });
            const { data } = await client.from("products").select("slug").eq("published", true);
            productPaths = (data ?? []).map((p: { slug: string }) => `/product/${p.slug}`);
          } catch { /* fall through */ }
        }

        const urls = [
          ...staticEntries.map((e) => `  <url>\n    <loc>${BASE_URL}${e.path}</loc>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`),
          ...productPaths.map((p) => `  <url>\n    <loc>${BASE_URL}${p}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
