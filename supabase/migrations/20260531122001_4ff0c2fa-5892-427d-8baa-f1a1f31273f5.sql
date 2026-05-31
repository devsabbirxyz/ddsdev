
-- Trigger: when a subscription-linked order becomes 'completed', activate/extend the subscription
CREATE OR REPLACE FUNCTION public.handle_subscription_order_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_days INT;
  current_expiry TIMESTAMPTZ;
  base TIMESTAMPTZ;
BEGIN
  IF NEW.subscription_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.status <> 'completed' THEN
    RETURN NEW;
  END IF;
  -- Avoid re-processing if already completed
  IF OLD IS NOT NULL AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT sp.duration_days, s.expires_at
    INTO plan_days, current_expiry
  FROM public.subscriptions s
  JOIN public.subscription_plans sp ON sp.id = s.plan_id
  WHERE s.id = NEW.subscription_id;

  IF plan_days IS NULL THEN
    RETURN NEW;
  END IF;

  -- Extend from later of (now, current_expiry) so renewals stack
  base := GREATEST(COALESCE(current_expiry, now()), now());

  UPDATE public.subscriptions
  SET status = 'active',
      expires_at = base + (plan_days || ' days')::interval,
      started_at = COALESCE(started_at, now()),
      cancelled_at = NULL,
      renewal_reminder_sent_at = NULL,
      last_order_id = NEW.id,
      updated_at = now()
  WHERE id = NEW.subscription_id;

  -- Notify user
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.user_id,
    'subscription',
    'সাবস্ক্রিপশন সক্রিয়',
    'আপনার সাবস্ক্রিপশন সফলভাবে ' || COALESCE(plan_days::text, '') || ' দিনের জন্য সক্রিয় হয়েছে।',
    '/dashboard/subscriptions'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscription_order_paid ON public.orders;
CREATE TRIGGER trg_subscription_order_paid
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_subscription_order_paid();
