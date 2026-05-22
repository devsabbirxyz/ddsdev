import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, Calendar, ArrowRight } from "lucide-react";
import { blogPostsQuery } from "@/lib/storefront";
import { EmptyState } from "@/components/storefront/ProductCard";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "ব্লগ — DDS-Digital" },
      { name: "description", content: "DDS-Digital ব্লগ — টিপস, গাইড, ডিজিটাল প্রোডাক্ট রিভিউ ও নতুন আপডেট।" },
      { property: "og:title", content: "ব্লগ — DDS-Digital" },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: BlogList,
});

function BlogList() {
  const { data: posts = [], isLoading } = useQuery(blogPostsQuery());

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-block rounded-full glass px-4 py-1.5 text-xs font-medium mb-3">📝 ব্লগ</div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl">
          সর্বশেষ <span className="text-gradient-brand">আর্টিকেল</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          ডিজিটাল প্রোডাক্ট, টিপস, গাইড এবং DDS-Digital এর নতুন আপডেট নিয়ে লেখা।
        </p>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="glass-card rounded-2xl h-80 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState title="এখনো কোনো ব্লগ পোস্ট নেই" hint="শীঘ্রই নতুন আর্টিকেল প্রকাশিত হবে।" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
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
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {p.published_at ? new Date(p.published_at).toLocaleDateString("bn-BD") : "ড্রাফট"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {p.view_count ?? 0}
                  </span>
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
