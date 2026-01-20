-- Allow authenticated users to create organizations
-- This policy allows any authenticated user to INSERT a row into the organizations table.
-- The subsequent logic (trigger or application code) should handle assigning them as admin.

CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);
