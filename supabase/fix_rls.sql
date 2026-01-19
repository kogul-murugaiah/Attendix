-- Fix RLS Policy for Participants
-- Original policy 'TO anon' prevents logged-in users (like staff testing the app) from registering.
-- Changing to 'TO public' allows everyone.

DROP POLICY IF EXISTS "Public can register" ON participants;

CREATE POLICY "Public can register" ON participants
  FOR INSERT TO public WITH CHECK (true);
