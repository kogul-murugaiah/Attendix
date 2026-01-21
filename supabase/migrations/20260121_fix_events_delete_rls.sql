-- Fix DELETE permission for org admins on events
-- The existing "FOR ALL" policy should work, but let's ensure it has both USING and WITH CHECK

DROP POLICY IF EXISTS "Org admins can manage events" ON events;
CREATE POLICY "Org admins can manage events" ON events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = events.organization_id 
      AND organization_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = events.organization_id 
      AND organization_admins.user_id = auth.uid()
    )
  );

-- Also ensure staff can also delete events if they have admin role
DROP POLICY IF EXISTS "Staff admins can manage events" ON events;
CREATE POLICY "Staff admins can manage events" ON events
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.organization_id = events.organization_id 
      AND staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'event_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.organization_id = events.organization_id 
      AND staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'event_manager')
    )
  );
