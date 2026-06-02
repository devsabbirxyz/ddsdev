
-- Stock tracking
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stock_quantity integer,
  ADD COLUMN IF NOT EXISTS track_stock boolean NOT NULL DEFAULT false;

ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS stock_quantity integer;

-- Product Q&A
CREATE TABLE IF NOT EXISTS public.product_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  user_name text,
  question text NOT NULL,
  answer text,
  answered_at timestamp with time zone,
  answered_by uuid,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_questions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.product_questions TO authenticated;
GRANT ALL ON public.product_questions TO service_role;

ALTER TABLE public.product_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read public questions"
  ON public.product_questions FOR SELECT
  USING (is_public = true OR auth.uid() = user_id OR is_admin(auth.uid()));

CREATE POLICY "users ask questions"
  ON public.product_questions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins manage questions"
  ON public.product_questions FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "admins delete questions"
  ON public.product_questions FOR DELETE TO authenticated
  USING (is_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_product_questions_product ON public.product_questions(product_id, created_at DESC);
