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

  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <article className="relative mx-auto max-w-3xl px-4 sm:px-6 py-10">
      {/* glow backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-glow opacity-60" />

      <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> সব আর্টিকেল
      </Link>

      <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> ব্লগ আর্টিকেল
      </div>

      <h1 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-gradient-brand">
        {post.title}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-brand text-primary-foreground font-bold text-[10px]">DDS</span>
          <span className="font-semibold text-foreground">DDS-Digital Team</span>
        </span>
        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{dateStr}</span>
        <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.view_count ?? 0} ভিউ</span>
      </div>

      {post.thumbnail_url && (
        <div className="mt-8 aspect-video glass-card rounded-3xl overflow-hidden shadow-glow">
          <img src={post.thumbnail_url} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}

      {post.short_description && (
        <p className="mt-8 text-lg sm:text-xl text-muted-foreground leading-relaxed border-l-2 border-primary/60 pl-4 italic">
          {post.short_description}
        </p>
      )}

      <div className="mt-10 glass-card rounded-3xl p-6 sm:p-10">
        <div className="prose prose-invert prose-lg max-w-none whitespace-pre-wrap leading-relaxed prose-headings:font-display prose-headings:text-gradient-brand prose-a:text-primary">
          {post.content || "এই পোস্টের কন্টেন্ট শীঘ্রই যোগ হবে।"}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-glass-border pt-6">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> অন্য আর্টিকেল পড়ুন
        </Link>
        <Link to="/shop" className="rounded-2xl bg-gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow hover:scale-105 transition">
          শপ এক্সপ্লোর করুন →
        </Link>
      </div>
    </article>
  );
}

