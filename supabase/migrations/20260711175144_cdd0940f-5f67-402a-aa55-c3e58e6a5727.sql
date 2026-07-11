
-- Reward points constant
CREATE OR REPLACE FUNCTION public.complete_referral_on_order() RETURNS TRIGGER AS $$
DECLARE
  ref_row RECORD;
  reward_points INT := 50;
BEGIN
  -- only proceed on transition into 'completed'
  IF NEW.status <> 'completed' THEN RETURN NEW; END IF;
  IF OLD IS NOT NULL AND OLD.status = 'completed' THEN RETURN NEW; END IF;

  -- find pending referral for this buyer
  SELECT * INTO ref_row FROM public.user_referrals
  WHERE referred_id = NEW.user_id AND status = 'pending'
  LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- mark completed + record first order
  UPDATE public.user_referrals
  SET status = 'completed',
      first_order_id = NEW.id,
      points_awarded = reward_points,
      completed_at = now()
  WHERE id = ref_row.id;

  -- credit both users
  UPDATE public.users
  SET wallet_points = COALESCE(wallet_points,0) + reward_points
  WHERE id IN (ref_row.referrer_id, ref_row.referred_id);

  -- ledger entries
  INSERT INTO public.wallet_transactions (user_id, points, type, order_id, description)
  VALUES
    (ref_row.referrer_id, reward_points, 'referral', NEW.id, 'রেফারেল বোনাস'),
    (ref_row.referred_id, reward_points, 'referral', NEW.id, 'সাইনআপ রেফারেল বোনাস');

  -- notifications
  INSERT INTO public.notifications (user_id, type, title, message, link) VALUES
    (ref_row.referrer_id, 'reward', 'রেফারেল বোনাস!',
     'আপনার রেফার করা ইউজার প্রথম অর্ডার সম্পন্ন করেছে। +' || reward_points || ' পয়েন্ট!', '/dashboard/referrals'),
    (ref_row.referred_id, 'reward', 'স্বাগতম বোনাস!',
     'রেফারেল সাইনআপ বোনাস: +' || reward_points || ' পয়েন্ট আপনার ওয়ালেটে যোগ হয়েছে।', '/dashboard/wallet');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_complete_referral_on_order ON public.orders;
CREATE TRIGGER trg_complete_referral_on_order
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.complete_referral_on_order();
