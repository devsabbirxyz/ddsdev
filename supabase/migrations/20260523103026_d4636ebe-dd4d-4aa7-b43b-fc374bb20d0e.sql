INSERT INTO public.user_roles (user_id, role, is_active)
SELECT id, 'super_admin', true FROM public.users WHERE email='admin@ddsdigital.com'
ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;