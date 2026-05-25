UPDATE public.products SET is_active = true WHERE status = 'approved' AND is_active = false;
ALTER TABLE public.products ALTER COLUMN is_active SET DEFAULT true;