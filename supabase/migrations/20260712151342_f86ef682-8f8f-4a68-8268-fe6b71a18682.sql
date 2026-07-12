
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'DDS-Digital Team';

CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
