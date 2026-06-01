ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS use_guide_type TEXT CHECK (use_guide_type IN ('text','image','video','none')) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS use_guide_text TEXT,
  ADD COLUMN IF NOT EXISTS use_guide_image_url TEXT,
  ADD COLUMN IF NOT EXISTS use_guide_video_url TEXT,
  ADD COLUMN IF NOT EXISTS use_guide_visible_after_purchase BOOLEAN NOT NULL DEFAULT TRUE;