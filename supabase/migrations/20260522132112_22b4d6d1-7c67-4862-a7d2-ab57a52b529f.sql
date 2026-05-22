
-- Tighten overly-permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers
  FOR INSERT WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

DROP POLICY IF EXISTS "Anyone can log view" ON public.product_view_logs;
CREATE POLICY "Anyone can log view" ON public.product_view_logs
  FOR INSERT WITH CHECK (
    product_id IS NOT NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Revoke direct EXECUTE on trigger-only functions (still callable internally by triggers)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role must remain callable for RLS evaluation; this is the canonical Supabase pattern
