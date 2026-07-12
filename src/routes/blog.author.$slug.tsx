import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { Calendar, Eye, ArrowRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/storefront/ProductCard";

const SITE = "https://ddsdev.lovable.app";

const authorPostsQuery = (author: string) =>
  queryOptions({
    queryKey: ["blog-author", author],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id,slug,title,thumbnail_url,short_description,published_at,view_count,category,author_name")
        .eq("is_published", true)
        .eq("author_name", author)
        .order("published_at", { ascending: false, nullsFirst: false });
      if (error) return [];
      return data ?? [];
    },
  });

export const Route = createFileRoute("/blog/author/$slug")({
  loader: async ({ context, params }) => {
    const author = decodeURIComponent(params.slug);
    await context.queryClient.ensureQueryData(authorPostsQuery(author));
    return { author };
  },
  head: ({ params }) => {
    const author = decodeURIComponent(params.slug);
    const title = `${author} — লেখক — DDS-Digital ব্লগ`;
    const desc = `${author} এর লেখা সব আর্টিকেল পড়ুন DDS-Digital ব্লগে।`;
    const url = `${SITE}/blog/author/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            mainEntity: { "@type": "Person", name: author },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "হোম", item: SITE },
              { "@type": "ListItem", position: 2, name: "ব্লগ", item: `${SITE}/blog` },
              { "@type": "ListItem", position: 3, name: author, item: url },
            ],
          }),
        },
      ],
    };
  },
  component: AuthorPage,
});

function AuthorPage() {
  const { author } = Route.useLoaderData();
  const { data: posts = [], isLoading } = useQuery(authorPostsQuery(author));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <nav className="text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">হোম</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-foreground">ব্লগ</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{author}</span>
      </nav>

      <div className="glass-card rounded-3xl p-6 sm:p-10 mb-10 flex flex-col sm:flex-row items-center gap-6">
        <div className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-gradient-brand text-primary-foreground font-display font-bold text-3xl shadow-glow">
          {author.slice(0, 2).toUpperCase()}
        </div>
        <div className="text-center sm:text-left">
          <div className="inline-flex items-center gap-1 rounded-full glass px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary mb-2">
            <User className="h-3 w-3" /> লেখক
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-gradient-brand">{author}</h1>
          <p className="mt-2 text-sm text-muted-foreground">DDS-Digital ব্লগে মোট {posts.length}টি আর্টিকেল</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card rounded-2xl h-80 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState title="এই লেখকের কোনো পোস্ট নেই" hint="অন্য লেখকদের পোস্ট দেখুন।" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p: any) => (
            <Link
              key={p.id}
              to="/blog/$slug"
              params={{ slug: p.slug }}
              className="group glass-card rounded-2xl overflow-hidden hover:shadow-glow hover:-translate-y-1 transition-all"
            >
              <div className="aspect-video bg-gradient-glow overflow-hidden">
                {p.thumbnail_url ? (
                  <img src={p.thumbnail_url} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full grid place-items-center text-6xl font-display font-bold text-gradient-brand opacity-25">
                    {p.title.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="p-5">
                {p.category && (
                  <span className="inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider mb-2">
                    {p.category}
                  </span>
                )}
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
