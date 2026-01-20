-- Allow everyone (authenticated and anon) to view organizations
-- Previously limited to 'anon', causing issues for logged-in users (Staff, Admins) accessing public pages

DROP POLICY IF EXISTS "public_view_org_by_code" ON organizations;

CREATE POLICY "everyone_can_view_organizations" ON organizations
  FOR SELECT
  USING (true);
