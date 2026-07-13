
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_log_created_at_idx ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_log_actor_idx ON public.admin_audit_log (actor_id);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_admin_read" ON public.admin_audit_log;
CREATE POLICY "audit_admin_read" ON public.admin_audit_log
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()) = true);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS auto_deliver boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.auto_deliver_account_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
  acc RECORD;
  parts text[] := ARRAY[]::text[];
  chunk text;
  i int;
  qty int;
BEGIN
  IF NEW.status NOT IN ('completed','paid','approved') THEN RETURN NEW; END IF;
  IF NEW.delivery_status = 'delivered' THEN RETURN NEW; END IF;
  IF NEW.product_id IS NULL THEN RETURN NEW; END IF;

  SELECT id, title, delivery_type, delivery_content, COALESCE(auto_deliver,true) AS auto_deliver
    INTO p FROM public.products WHERE id = NEW.product_id;
  IF NOT FOUND OR p.auto_deliver = false THEN RETURN NEW; END IF;

  qty := COALESCE(NEW.quantity, 1);

  IF p.delivery_type = 'account' THEN
    FOR i IN 1..qty LOOP
      SELECT id, username, password, extra_info INTO acc
      FROM public.product_accounts
      WHERE product_id = p.id
        AND is_sold = false
        AND (NEW.variant_id IS NULL OR variant_id = NEW.variant_id)
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED;
      IF NOT FOUND THEN RETURN NEW; END IF;

      UPDATE public.product_accounts
      SET is_sold = true, sold_at = now(), order_id = NEW.id
      WHERE id = acc.id;

      chunk := '';
      IF acc.username IS NOT NULL THEN chunk := chunk || 'Username/Email: ' || acc.username || E'\n'; END IF;
      IF acc.password IS NOT NULL THEN chunk := chunk || 'Password: ' || acc.password || E'\n'; END IF;
      IF acc.extra_info IS NOT NULL THEN chunk := chunk || E'\n' || acc.extra_info; END IF;
      parts := parts || chunk;
    END LOOP;

    NEW.delivery_content := array_to_string(parts, E'\n\n---\n\n');
  ELSE
    IF NEW.delivery_content IS NULL OR NEW.delivery_content = '' THEN
      NEW.delivery_content := COALESCE(p.delivery_content, 'ডেলিভারি সম্পন্ন হয়েছে।');
    END IF;
  END IF;

  NEW.status := 'approved';
  NEW.delivery_status := 'delivered';
  NEW.updated_at := now();

  INSERT INTO public.notifications (user_id, type, title, message, link)
  SELECT NEW.user_id, 'order_delivered',
         'অর্ডার ডেলিভার হয়েছে',
         p.title || ' — অর্ডার #' || COALESCE(NEW.order_number,'') || ' স্বয়ংক্রিয়ভাবে ডেলিভার হয়েছে।',
         '/order/' || NEW.id
  WHERE NEW.user_id IS NOT NULL;

  INSERT INTO public.admin_audit_log (action, entity_type, entity_id, details)
  VALUES ('order.auto_deliver', 'order', NEW.id::text, jsonb_build_object('product_id', p.id, 'quantity', qty));

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_deliver_account_order ON public.orders;
CREATE TRIGGER trg_auto_deliver_account_order
BEFORE INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.auto_deliver_account_order();
