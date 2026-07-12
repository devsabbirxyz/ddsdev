import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://ddsdev.lovable.app";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/shop", changefreq: "daily", priority: "0.9" },
          { path: "/about", changefreq: "monthly", priority: "0.6" },
          { path: "/faq", changefreq: "monthly", priority: "0.5" },
          { path: "/blog", changefreq: "weekly", priority: "0.7" },
          { path: "/apply-affiliate", changefreq: "monthly", priority: "0.5" },
          { path: "/apply-seller", changefreq: "monthly", priority: "0.5" },
          { path: "/privacy", changefreq: "yearly", priority: "0.3" },
          { path: "/refund", changefreq: "yearly", priority: "0.3" },
          { path: "/terms", changefreq: "yearly", priority: "0.3" },
          { path: "/developer", changefreq: "monthly", priority: "0.4" },
          { path: "/login", changefreq: "yearly", priority: "0.3" },
          { path: "/register", changefreq: "yearly", priority: "0.3" },
          { path: "/forgot-password", changefreq: "yearly", priority: "0.2" },
          { path: "/cart", changefreq: "weekly", priority: "0.4" },
        ];

        try {
          const { data: products } = await supabase
            .from("products")
            .select("slug, updated_at")
            .eq("is_active", true)
            .eq("status", "approved")
            .limit(1000);
          if (products) {
            for (const p of products) {
              entries.push({
                path: `/product/${p.slug}`,
                lastmod: p.updated_at ?? undefined,
                changefreq: "weekly",
                priority: "0.8",
              });
            }
          }
        } catch {
          // ignore
        }

        try {
          const { data: posts } = await supabase
            .from("blog_posts")
            .select("slug, updated_at, category, author_name")
            .eq("is_published", true)
            .limit(1000);
          if (posts) {
            const categorySet = new Set<string>();
            const authorSet = new Set<string>();
            for (const b of posts as any[]) {
              entries.push({
                path: `/blog/${b.slug}`,
                lastmod: b.updated_at ?? undefined,
                changefreq: "monthly",
                priority: "0.6",
              });
              if (b.category) categorySet.add(b.category);
              if (b.author_name) authorSet.add(b.author_name);
            }
            for (const c of categorySet) {
              entries.push({
                path: `/blog/category/${encodeURIComponent(c)}`,
                changefreq: "weekly",
                priority: "0.5",
              });
            }
            for (const a of authorSet) {
              entries.push({
                path: `/blog/author/${encodeURIComponent(a)}`,
                changefreq: "weekly",
                priority: "0.4",
              });
            }
          }
        } catch {
          // ignore
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
