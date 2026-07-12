-- 1) USERS: restrict authenticated UPDATE to safe self-service columns only.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (full_name, phone, avatar_url, updated_at) ON public.users TO authenticated;

DROP POLICY IF EXISTS "users update own" ON public.users;
CREATE POLICY "users update own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2) ORDERS: sellers may only update delivery-related fields on their orders.
REVOKE UPDATE ON public.orders FROM authenticated;
GRANT UPDATE (
  delivery_status,
  delivery_content,
  rejection_reason,
  updated_at
) ON public.orders TO authenticated;

DROP POLICY IF EXISTS "admins update orders" ON public.orders;
CREATE POLICY "sellers and admins update orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = orders.seller_id AND s.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = orders.seller_id AND s.user_id = auth.uid()
    )
  );

-- 3) REVIEWS: owners may only edit rating/text; product_id, order_id locked.
REVOKE UPDATE ON public.reviews FROM authenticated;
GRANT UPDATE (rating, review_text, updated_at) ON public.reviews TO authenticated;

DROP POLICY IF EXISTS "users update own reviews" ON public.reviews;
CREATE POLICY "users update own reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
  WITH CHECK (auth.uid() = user_id OR public.is_admin(auth.uid()));
