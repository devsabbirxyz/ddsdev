CREATE OR REPLACE FUNCTION public.increment_product_view_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
      SET view_count = COALESCE(view_count, 0) + 1
      WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_increment_product_view_count ON public.product_view_logs;

CREATE TRIGGER trg_increment_product_view_count
AFTER INSERT ON public.product_view_logs
FOR EACH ROW EXECUTE FUNCTION public.increment_product_view_count();