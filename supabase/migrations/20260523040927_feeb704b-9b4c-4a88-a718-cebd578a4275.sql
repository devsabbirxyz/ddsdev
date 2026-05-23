-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('hero-slides', 'hero-slides', true),
  ('offer-slides', 'offer-slides', true),
  ('category-icons', 'category-icons', true),
  ('admin-uploads', 'admin-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 4 buckets (public read, admin write)
DO $$
DECLARE
  b text;
BEGIN
  FOREACH b IN ARRAY ARRAY['hero-slides','offer-slides','category-icons','admin-uploads']
  LOOP
    EXECUTE format($f$
      CREATE POLICY "Public read %1$s" ON storage.objects FOR SELECT USING (bucket_id = %2$L);
    $f$, b, b);
    EXECUTE format($f$
      CREATE POLICY "Admins write %1$s" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = %2$L AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role) OR public.has_role(auth.uid(), 'moderator'::app_role)));
    $f$, b, b);
    EXECUTE format($f$
      CREATE POLICY "Admins update %1$s" ON storage.objects FOR UPDATE
      USING (bucket_id = %2$L AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role)));
    $f$, b, b);
    EXECUTE format($f$
      CREATE POLICY "Admins delete %1$s" ON storage.objects FOR DELETE
      USING (bucket_id = %2$L AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'super_admin'::app_role)));
    $f$, b, b);
  END LOOP;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- user_roles: add is_active for admin activation/deactivation
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Allow super_admins to manage all roles; users can view own
DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles" ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Update has_role to respect is_active
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND COALESCE(is_active, true) = true
  )
$$;