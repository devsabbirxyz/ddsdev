
-- Fix: Restrict api_key column on payment_methods from public/auth roles
REVOKE SELECT (api_key) ON public.payment_methods FROM anon, authenticated;

-- Fix: Drop overly broad public sellers SELECT policy (no public UI uses it)
DROP POLICY IF EXISTS "Public view approved sellers" ON public.sellers;

-- Fix: Drop blanket public users SELECT policy exposing emails/phones
DROP POLICY IF EXISTS "Public view seller/affiliate names" ON public.users;

-- Fix: Drop broad storage.objects SELECT policy allowing listing of product-images
-- (public bucket continues to serve files via public URL without this policy)
DROP POLICY IF EXISTS "Public view product images" ON storage.objects;
