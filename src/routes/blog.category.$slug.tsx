import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Eye, ArrowRight, Tag } from "lucide-react";
import { blogPostsQuery } from "@/lib/storefront";
import { EmptyState } from "@/components/storefront/ProductCard";

const SITE = "https://ddsdev.lovable.app";

export const Route = createFileRoute("/blog/category/$slug")({
  loader: async ({ context, params }) => {
    const category = decodeURIComponent(params.slug);
    const posts = await context.queryClient.ensureQueryData(blogPostsQuery(undefined, { category }));
    if (!posts || posts.length === 0) {
      // still allow rendering an empty state, but hint 404 for truly unknown categories
    }
    return { category };
  },
  head: ({ params }) => {
    const category = decodeURIComponent(params.slug);
    const title = `${category} — ব্লগ — DDS-Digital`;
    const desc = `${category} ক্যাটেগরির সব আর্টিকেল — DDS-Digital ব্লগ।`;
    const url = `${SITE}/blog/category/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "হোম", item: SITE },
            { "@type": "ListItem", position: 2, name: "ব্লগ", item: `${SITE}/blog` },
            { "@type": "ListItem", position: 3, name: category, item: url },
          ],
        }),
      }],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="grid place-items-center min-h-[60vh] px-4">
      <div className="text-center">
        <h1 className="font-display font-bold text-3xl">ক্যাটেগরি পাওয়া যায়নি</h1>
        <Link to="/blog" className="mt-4 inline-block rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">ব্লগে ফিরে যান</Link>
      </div>
    </div>
  ),
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const { data: posts = [], isLoading } = useQuery(blogPostsQuery(undefined, { category }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">হোম</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-foreground">ব্লগ</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{category}</span>
      </nav>
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1 rounded-full glass px-4 py-1.5 text-xs font-medium mb-3">
          <Tag className="h-3 w-3" /> ক্যাটেগরি
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-gradient-brand">{category}</h1>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card rounded-2xl h-80 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState title="এই ক্যাটেগরিতে কোনো পোস্ট নেই" hint="অন্য ক্যাটেগরি দেখুন।" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p: any) => (
            <Link
              key={p.id}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group glass-card rounded-2xl overflow-hidden hover:shadow-glow hover:-translate-y-1 transition-all"
            >
              <div className="aspect-video bg-gradient-glow grid place-items-center overflow-hidden">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="text-6xl font-display font-bold text-gradient-brand opacity-25">
                    {p.title.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="p-5">
                <h2 className="font-display font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h2>
                {p.short_description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.short_description}</p>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{p.published_at ? new Date(p.published_at).toLocaleDateString("bn-BD") : "—"}</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{p.view_count ?? 0}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
