-- Allow Org Admins to update their own organization row
-- Specifically needed for logo_url and other branding settings
DROP POLICY IF EXISTS "org_admins_update_own_org" ON organizations;

CREATE POLICY "org_admins_update_own_org" ON organizations
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = organizations.id 
      AND organization_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = organizations.id 
      AND organization_admins.user_id = auth.uid()
    )
  );
