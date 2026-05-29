-- Fix admin product creation failures caused by missing EXECUTE grants on has_role().
-- The app already uses public.has_role(uuid, app_role) in several RLS policies,
-- so keep that canonical signature and also add the text overload requested for
-- simple policy calls such as has_role('admin').

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND COALESCE(is_active, true) = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = required_role
      AND COALESCE(is_active, true) = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_role(text) TO anon, authenticated, service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;

CREATE POLICY "users_read_own_role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admin_insert_products" ON public.products;
DROP POLICY IF EXISTS "admin_update_products" ON public.products;
DROP POLICY IF EXISTS "admin_delete_products" ON public.products;
DROP POLICY IF EXISTS "admin_select_products" ON public.products;

CREATE POLICY "admin_insert_products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) = true);

CREATE POLICY "admin_update_products"
ON public.products
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) = true)
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) = true);

CREATE POLICY "admin_delete_products"
ON public.products
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) = true);

CREATE POLICY "admin_select_products"
ON public.products
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) = true
  OR (is_active = true AND status = 'approved')
);
