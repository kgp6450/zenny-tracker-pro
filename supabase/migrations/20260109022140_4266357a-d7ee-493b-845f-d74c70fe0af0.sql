-- Add time column to expenses table
ALTER TABLE public.expenses ADD COLUMN time TIME DEFAULT '12:00:00';