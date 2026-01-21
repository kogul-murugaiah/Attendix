-- Allow Super Admins to read organization_admins for any organization
DROP POLICY IF EXISTS "super_admins_view_org_admins" ON organization_admins;
CREATE POLICY "super_admins_view_org_admins" ON organization_admins
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
  );

-- Allow Super Admins to update organization_admins
DROP POLICY IF EXISTS "super_admins_update_org_admins" ON organization_admins;
CREATE POLICY "super_admins_update_org_admins" ON organization_admins
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
  );
