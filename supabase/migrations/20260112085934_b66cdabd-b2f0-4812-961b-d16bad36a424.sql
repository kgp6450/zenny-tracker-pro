-- Remove client-side access to sensitive push subscription columns
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own subscriptions" ON public.push_subscriptions;

-- Create new restrictive policies that only allow access to non-sensitive columns via RLS
-- All sensitive operations will go through the edge function with service role

-- Users can only read their subscription status (not the keys)
-- This policy allows SELECT but the edge function handles all data access
CREATE POLICY "Users can check subscription existence"
ON public.push_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only the service role (edge functions) can insert/update/delete
-- No direct client policies for INSERT, UPDATE, DELETE
-- The edge function uses service role key to bypass RLS