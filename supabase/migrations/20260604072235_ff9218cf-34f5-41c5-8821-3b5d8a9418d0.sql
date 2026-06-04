
-- 1) Restrict products.delivery_content from being read by clients
REVOKE SELECT ON public.products FROM anon, authenticated;
GRANT SELECT (
  id, seller_id, category_id, title, title_en, slug,
  short_description, short_description_en, long_description, long_description_en,
  regular_price, offer_price, delivery_type,
  subscription_input_label, subscription_input_label_en,
  video_url, seo_title, seo_description,
  is_variant, is_active, is_featured, is_new_arrival, is_best_seller,
  status, rejection_reason, total_sales, total_reviews, average_rating, view_count,
  created_at, updated_at,
  use_guide_type, use_guide_text, use_guide_image_url, use_guide_video_url, use_guide_visible_after_purchase,
  stock_quantity, track_stock
) ON public.products TO anon, authenticated;

-- Restrict UPDATE columns sellers can write directly (defense in depth)
REVOKE UPDATE ON public.products FROM anon, authenticated;
GRANT UPDATE (
  title, title_en, slug, category_id,
  short_description, short_description_en, long_description, long_description_en,
  regular_price, offer_price, delivery_type,
  subscription_input_label, subscription_input_label_en,
  video_url, seo_title, seo_description,
  is_variant, is_active,
  use_guide_type, use_guide_text, use_guide_image_url, use_guide_video_url, use_guide_visible_after_purchase,
  stock_quantity, track_stock
) ON public.products TO authenticated;

-- 2) Restrict sellers financial columns from clients
REVOKE SELECT ON public.sellers FROM anon, authenticated;
GRANT SELECT (
  id, user_id, store_name, store_description, store_logo_url, store_cover_url,
  status, created_at, updated_at
) ON public.sellers TO anon, authenticated;

-- 3) Subscriptions: remove user UPDATE policy (changes go through server fns using service role)
DROP POLICY IF EXISTS "users update own subs" ON public.subscriptions;

-- 4) product_variants: restrict to approved + active parent products
DROP POLICY IF EXISTS "public read variants" ON public.product_variants;
CREATE POLICY "public read approved variants" ON public.product_variants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_variants.product_id
        AND p.status = 'approved'
        AND p.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.sellers s ON s.id = p.seller_id
      WHERE p.id = product_variants.product_id
        AND s.user_id = auth.uid()
    )
    OR public.is_admin(auth.uid())
  );

-- 5) Sellers table: explicitly block non-admin INSERT (documents intent)
DROP POLICY IF EXISTS "no client insert sellers" ON public.sellers;
CREATE POLICY "no client insert sellers" ON public.sellers
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
