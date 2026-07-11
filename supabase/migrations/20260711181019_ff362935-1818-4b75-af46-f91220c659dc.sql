-- Push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subs"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_push_subs_user ON public.push_subscriptions(user_id) WHERE is_active = true;

CREATE TRIGGER push_subs_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Push notification log (for admin visibility + preventing duplicates)
CREATE TABLE public.push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- order_status, flash_sale, abandoned_cart, wallet_reward, broadcast
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  reference_id TEXT, -- order_id, cart snapshot hash, etc.
  sent_count INT DEFAULT 0,
  failed_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.push_notification_log TO authenticated;
GRANT ALL ON public.push_notification_log TO service_role;

ALTER TABLE public.push_notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all logs"
  ON public.push_notification_log FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE INDEX idx_push_log_event ON public.push_notification_log(event_type, created_at DESC);
CREATE INDEX idx_push_log_ref ON public.push_notification_log(reference_id) WHERE reference_id IS NOT NULL;

-- Track abandoned cart push reminders (prevent spam)
ALTER TABLE public.abandoned_carts
  ADD COLUMN IF NOT EXISTS push_reminded_at TIMESTAMPTZ;