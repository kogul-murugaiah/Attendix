-- Enable RLS for student_registrations
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;

-- Allow Authenticated Users to View All Student Registrations
-- This creates a wide policy to ensure Realtime works for Admins.
-- We rely on the application query (organization_id filter) for tenancy.
CREATE POLICY "Allow read access for authenticated users" ON student_registrations
FOR SELECT TO authenticated
USING (true);

-- Allow Authenticated Users (Reception/Staff) to Update
CREATE POLICY "Allow update access for authenticated users" ON student_registrations
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);
