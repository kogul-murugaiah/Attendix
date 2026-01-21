-- Allow Super Admins to update organizations
CREATE POLICY "super_admins_update_orgs" ON organizations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
  );
