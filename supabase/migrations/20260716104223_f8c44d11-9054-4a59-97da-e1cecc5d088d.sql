ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id text,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Allow the owner to update their own order after payment (status + razorpay ids only enforced client-side; RLS scoped by owner).
DROP POLICY IF EXISTS "update own orders" ON public.orders;
CREATE POLICY "update own orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);