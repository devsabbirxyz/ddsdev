
-- 1) Hide api_key on payment_methods from non-admin roles
REVOKE SELECT (api_key) ON public.payment_methods FROM anon, authenticated;

-- 2) Restrict site_settings public read to non-sensitive keys
DROP POLICY IF EXISTS "public read site_settings" ON public.site_settings;
CREATE POLICY "public read site_settings" ON public.site_settings
  FOR SELECT USING (
    key !~* '(token|secret|api[_-]?key|password|webhook|private)'
  );

-- 3) Restrict product-images storage update/delete to admins
DROP POLICY IF EXISTS "auth delete product-images" ON storage.objects;
DROP POLICY IF EXISTS "auth update product-images" ON storage.objects;
DROP POLICY IF EXISTS "auth upload product-images" ON storage.objects;

CREATE POLICY "admins upload product-images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "admins update product-images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

CREATE POLICY "admins delete product-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

-- 4) Revoke public EXECUTE on internal trigger functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_subscription_order_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
