import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Eye, ArrowLeft, ArrowRight, Tag, User } from "lucide-react";
import { blogPostBySlugQuery, relatedBlogPostsQuery } from "@/lib/storefront";

const SITE = "https://ddsdev.lovable.app";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(blogPostBySlugQuery(params.slug));
    if (!post) throw notFound();
    return { post };
  },
  head: ({ loaderData, params }) => {
    const p: any = loaderData?.post;
    const title = p ? `${p.seo_title || p.title} — DDS-Digital Blog` : "ব্লগ — DDS-Digital";
    const desc = p?.seo_description || p?.short_description || "DDS-Digital ব্লগ আর্টিকেল।";
    const url = `${SITE}/blog/${params.slug}`;
    const image = p?.og_image || p?.thumbnail_url;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image } as const] : []),
        ...(image ? [{ name: "twitter:image", content: image } as const] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        ...(p?.category ? [{ property: "article:section", content: p.category } as const] : []),
        ...(p?.author_name ? [{ property: "article:author", content: p.author_name } as const] : []),
        ...(p?.published_at ? [{ property: "article:published_time", content: p.published_at } as const] : []),
        ...(p?.updated_at ? [{ property: "article:modified_time", content: p.updated_at } as const] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p ? [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            headline: p.title,
            description: desc,
            image: image ? [image] : undefined,
            datePublished: p.published_at,
            dateModified: p.updated_at || p.published_at,
            author: { "@type": "Person", name: p.author_name || "DDS-Digital Team" },
            publisher: {
              "@type": "Organization",
              name: "DDS-Digital",
              logo: { "@type": "ImageObject", url: `${SITE}/favicon.ico` },
            },
            ...(p.category ? { articleSection: p.category } : {}),
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
              ...(p.category ? [{ "@type": "ListItem", position: 3, name: p.category, item: `${SITE}/blog/category/${encodeURIComponent(p.category)}` }] : []),
              { "@type": "ListItem", position: p.category ? 4 : 3, name: p.title, item: url },
            ],
          }),
        },
      ] : [],
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
  const { data: related = [] } = useQuery(relatedBlogPostsQuery({ excludeId: post?.id ?? "", category: post?.category, limit: 3 }));
  if (!post) return null;

  const dateStr = post.published_at
    ? new Date(post.published_at).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const author = post.author_name || "DDS-Digital Team";
  const authorSlug = encodeURIComponent(author);

  return (
    <article className="relative mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-glow opacity-60" />

      <nav className="text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">হোম</Link>
        <span className="mx-2">/</span>
        <Link to="/blog" className="hover:text-foreground">ব্লগ</Link>
        {post.category && (
          <>
            <span className="mx-2">/</span>
            <Link to="/blog/category/$slug" params={{ slug: encodeURIComponent(post.category) }} className="hover:text-foreground">
              {post.category}
            </Link>
          </>
        )}
      </nav>

      {post.category && (
        <Link
          to="/blog/category/$slug"
          params={{ slug: encodeURIComponent(post.category) }}
          className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold text-primary uppercase tracking-wider hover:bg-primary/25 transition"
        >
          <Tag className="h-3 w-3" /> {post.category}
        </Link>
      )}

      <h1 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] tracking-tight text-gradient-brand">
        {post.title}
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <Link to="/blog/author/$slug" params={{ slug: authorSlug }} className="inline-flex items-center gap-2 hover:text-foreground transition">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-brand text-primary-foreground font-bold text-[10px]">
            {author.slice(0, 2).toUpperCase()}
          </span>
          <span className="font-semibold text-foreground">{author}</span>
        </Link>
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

      {/* Author card */}
      <div className="mt-10 glass-card rounded-3xl p-6 flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground font-bold shadow-glow">
          {author.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">লিখেছেন</div>
          <Link to="/blog/author/$slug" params={{ slug: authorSlug }} className="font-display font-bold text-lg hover:text-primary transition">
            {author}
          </Link>
          <div className="text-xs text-muted-foreground mt-0.5">{author} এর সব পোস্ট দেখুন →</div>
        </div>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display font-bold text-2xl">সম্পর্কিত পোস্ট</h2>
            <Link to="/blog" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              সব পোস্ট <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((r: any) => (
              <Link
                key={r.id}
                to="/blog/$slug"
                params={{ slug: r.slug }}
                className="group glass-card rounded-2xl overflow-hidden hover:shadow-glow hover:-translate-y-1 transition-all"
              >
                <div className="aspect-video bg-gradient-glow overflow-hidden">
                  {r.thumbnail_url ? (
                    <img src={r.thumbnail_url} alt={r.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full grid place-items-center text-4xl font-display font-bold text-gradient-brand opacity-25">
                      {r.title.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">{r.title}</h3>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    {r.published_at ? new Date(r.published_at).toLocaleDateString("bn-BD") : "—"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
