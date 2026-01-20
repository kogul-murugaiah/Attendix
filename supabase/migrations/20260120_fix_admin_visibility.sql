-- Allow organization admins to view their own admin record.
-- Critical for RLS subqueries in other tables (events, staff, logs) to work correctly.

CREATE POLICY "Users can view own admin capabilities" ON organization_admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
