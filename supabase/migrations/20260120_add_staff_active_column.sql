-- Add is_active column to staff table to support soft deletes/deactivation
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
