-- Remove SELECT policy to prevent any client-side access to sensitive keys
-- All operations are now handled through the edge function with service role
DROP POLICY IF EXISTS "Users can check subscription existence" ON public.push_subscriptions;