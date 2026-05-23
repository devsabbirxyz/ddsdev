
-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('hero-slides','hero-slides', true),
  ('offer-slides','offer-slides', true),
  ('category-icons','category-icons', true),
  ('admin-uploads','admin-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Public read admin buckets' AND tablename='objects' AND schemaname='storage') THEN
    CREATE POLICY "Public read admin buckets" ON storage.objects FOR SELECT
      USING (bucket_id IN ('hero-slides','offer-slides','category-icons','admin-uploads'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Admins write admin buckets' AND tablename='objects' AND schemaname='storage') THEN
    CREATE POLICY "Admins write admin buckets" ON storage.objects FOR INSERT
      WITH CHECK (bucket_id IN ('hero-slides','offer-slides','category-icons','admin-uploads')
        AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Admins update admin buckets' AND tablename='objects' AND schemaname='storage') THEN
    CREATE POLICY "Admins update admin buckets" ON storage.objects FOR UPDATE
      USING (bucket_id IN ('hero-slides','offer-slides','category-icons','admin-uploads')
        AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role) OR has_role(auth.uid(),'moderator'::app_role)));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Admins delete admin buckets' AND tablename='objects' AND schemaname='storage') THEN
    CREATE POLICY "Admins delete admin buckets" ON storage.objects FOR DELETE
      USING (bucket_id IN ('hero-slides','offer-slides','category-icons','admin-uploads')
        AND (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role)));
  END IF;
END $$;

-- Offers
CREATE TABLE IF NOT EXISTS public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_en text,
  image_url text NOT NULL,
  link_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view active offers" ON public.offers;
CREATE POLICY "Public view active offers" ON public.offers FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins manage offers" ON public.offers;
CREATE POLICY "Admins manage offers" ON public.offers FOR ALL
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'super_admin'::app_role));

DROP TRIGGER IF EXISTS update_offers_updated_at ON public.offers;
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- user_roles enhancements
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DROP POLICY IF EXISTS "Super admins manage roles" ON public.user_roles;
CREATE POLICY "Super admins manage roles" ON public.user_roles FOR ALL
  USING (has_role(auth.uid(),'super_admin'::app_role));

DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- has_role honors is_active
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role AND COALESCE(is_active, true) = true
  )
$$;
