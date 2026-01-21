-- Fix RLS policy for super_admins to allow users to read their own record
-- This is necessary for the login page to verify if a user is a super admin.

DROP POLICY IF EXISTS "Users can read own super_admin status" ON super_admins;

CREATE POLICY "Users can read own super_admin status" ON super_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
