import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, Eye, ArrowLeft } from "lucide-react";
import { blogPostBySlugQuery } from "@/lib/storefront";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(blogPostBySlugQuery(params.slug));
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.post;
    const title = p ? `${p.title} — DDS-Digital Blog` : "ব্লগ — DDS-Digital";
    const desc = p?.short_description || "DDS-Digital ব্লগ আর্টিকেল।";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/blog/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts: p ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: p.title,
          datePublished: p.published_at,
          image: p.thumbnail_url,
        }),
      }] : [],
    };
  },
  component: BlogPost,
  notFoundComponent: () => (
    <div className="grid place-items-center min-h-[60vh] px-4">
      <div className="text-center">
        <h1 className="font-display font-bold text-3xl">পোস্ট পাওয়া যায়নি</h1>
        <Link to="/blog" className="mt-4 inline-block rounded-xl bg-gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow">ব্লগে ফিরে যান</Link>
      </div>
    </div>
  ),
});

function BlogPost() {
  const { post } = Route.useLoaderData();
  if (!post) return null;

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> সব আর্টিকেল
      </Link>

      <h1 className="font-display font-bold text-3xl sm:text-5xl leading-tight">{post.title}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{post.published_at ? new Date(post.published_at).toLocaleDateString("bn-BD") : "—"}</span>
        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{post.view_count ?? 0} ভিউ</span>
      </div>

      {post.thumbnail_url && (
        <div className="mt-6 aspect-video glass-card rounded-3xl overflow-hidden">
          <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}

      {post.short_description && (
        <p className="mt-6 text-lg text-muted-foreground leading-relaxed">{post.short_description}</p>
      )}

      <div className="mt-8 prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
        {post.content || "এই পোস্টের কন্টেন্ট শীঘ্রই যোগ হবে।"}
      </div>
    </article>
  );
}
