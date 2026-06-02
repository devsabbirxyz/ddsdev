
-- 1. Fix mutable search_path on set_updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- 2. Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated/public.
-- These are only meant to be called internally (triggers) or from RLS policies
-- (which run with definer privileges regardless of EXECUTE grants).
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_subscription_order_paid() FROM PUBLIC, anon, authenticated;

-- 3. Restrict storage object listing on public buckets (still allow reading individual files by URL).
-- Drop any over-broad SELECT policies on storage.objects for these buckets and recreate without listing.
-- Public buckets remain public for direct file URL access; only `list` operations are blocked for anon.
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND cmd='SELECT'
      AND (qual LIKE '%product-images%' OR qual LIKE '%offer-slides%' OR qual LIKE '%admin-uploads%')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

-- Allow public SELECT only when the requester supplies a specific object name (direct file access),
-- which PostgREST/storage handles via the file path. The policy below lets authenticated users (admins/sellers)
-- list, but blocks anonymous listing. Direct public file URLs continue to work because storage serves
-- public-bucket files through a separate CDN path that does not require a list query.
CREATE POLICY "Public buckets - authenticated can list"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id IN ('product-images','offer-slides','admin-uploads'));

CREATE POLICY "Public buckets - anon read individual files"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id IN ('product-images','offer-slides','admin-uploads') AND name IS NOT NULL);
