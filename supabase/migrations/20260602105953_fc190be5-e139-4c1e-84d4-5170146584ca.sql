ALTER TABLE public.subscription_plans
  ADD CONSTRAINT subscription_plans_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
NOTIFY pgrst, 'reload schema';