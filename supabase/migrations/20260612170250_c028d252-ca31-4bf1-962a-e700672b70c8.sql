
-- 1) Products: re-apply column-level SELECT (delivery_content excluded)
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

-- Re-restrict UPDATE columns on products
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

-- 2) Sellers: re-apply column-level SELECT (financial fields excluded)
REVOKE SELECT ON public.sellers FROM anon, authenticated;
GRANT SELECT (
  id, user_id, store_name, store_description, store_logo_url, store_cover_url,
  status, created_at, updated_at
) ON public.sellers TO anon, authenticated;

-- Sellers: restrict UPDATE to non-financial columns
REVOKE UPDATE ON public.sellers FROM anon, authenticated;
GRANT UPDATE (
  store_name, store_description, store_logo_url, store_cover_url
) ON public.sellers TO authenticated;

-- 3) Payment methods: hide api_key from public readers
REVOKE SELECT ON public.payment_methods FROM anon, authenticated;
GRANT SELECT (
  id, name, name_en, account_type, send_type, account_number,
  instructions, instructions_en,
  has_automatic, is_manual_active, is_automatic_active, sort_order, created_at
) ON public.payment_methods TO anon, authenticated;

-- 4) Subscriptions: remove client INSERT — only server functions (service role) may create
DROP POLICY IF EXISTS "users create own subs" ON public.subscriptions;
REVOKE INSERT ON public.subscriptions FROM anon, authenticated;
