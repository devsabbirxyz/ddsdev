
CREATE TABLE public.stock_notifications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  email text not null,
  user_id uuid,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
CREATE INDEX stock_notifications_product_idx ON public.stock_notifications(product_id, variant_id) WHERE notified_at IS NULL;
GRANT INSERT ON public.stock_notifications TO anon, authenticated;
GRANT ALL ON public.stock_notifications TO service_role;
ALTER TABLE public.stock_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can subscribe to back-in-stock" ON public.stock_notifications
  FOR INSERT TO anon, authenticated
  WITH CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

CREATE OR REPLACE FUNCTION public.recent_sales_count(p_product_id uuid, p_hours int DEFAULT 24)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(quantity),0)::int
  FROM public.orders
  WHERE product_id = p_product_id
    AND status IN ('completed','delivered','paid','processing','confirmed')
    AND created_at > now() - make_interval(hours => p_hours);
$$;
GRANT EXECUTE ON FUNCTION public.recent_sales_count(uuid, int) TO anon, authenticated;
