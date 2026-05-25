
-- Lock down public column access on payment_methods (hide api_key)
REVOKE SELECT ON TABLE public.payment_methods FROM anon, authenticated;
GRANT SELECT
  (id, name, name_en, account_type, send_type, account_number,
   instructions, instructions_en, has_automatic,
   is_manual_active, is_automatic_active, sort_order,
   created_at, updated_at)
  ON public.payment_methods TO anon, authenticated;

-- Lock down public column access on coupons (hide usage counters and limits)
REVOKE SELECT ON TABLE public.coupons FROM anon, authenticated;
GRANT SELECT
  (id, code, discount_type, discount_value, minimum_order,
   start_date, end_date, applies_to, is_active,
   created_at, updated_at)
  ON public.coupons TO anon, authenticated;
