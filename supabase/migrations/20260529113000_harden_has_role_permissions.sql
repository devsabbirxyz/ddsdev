-- Harden role checks used by admin pages and product RLS policies.
-- This migration is intentionally additive so it can repair older projects where
-- public.has_role() exists but the runtime roles cannot execute it.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(text) TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
