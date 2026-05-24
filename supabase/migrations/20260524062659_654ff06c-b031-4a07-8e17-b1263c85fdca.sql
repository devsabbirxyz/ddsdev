-- 1. Orders: enforce NOT NULL user_id and tighten INSERT policy
ALTER TABLE public.orders ALTER COLUMN user_id SET NOT NULL;

DROP POLICY IF EXISTS "Users create own orders" ON public.orders;
CREATE POLICY "Users create own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND delivery_status = 'pending'
);

-- 2. Payment methods: revoke api_key column access from anon/authenticated
REVOKE SELECT (api_key) ON public.payment_methods FROM anon, authenticated;

-- 3. Product accounts: scoped SELECT policy for owning customer
CREATE POLICY "Customers view own delivered product accounts"
ON public.product_accounts
FOR SELECT
TO authenticated
USING (
  order_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = product_accounts.order_id
      AND o.user_id = auth.uid()
  )
);