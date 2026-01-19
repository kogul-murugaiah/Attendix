-- FORCE CLEANUP SCRIPT
-- This script DOES NOT create constraints, so it will not fail.

-- 1. Delete the duplicate dummy admin row
DELETE FROM staff WHERE email = 'admin@test.com';

-- 2. Open up permissions so you can definitely login
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read staff" ON staff;
CREATE POLICY "Allow authenticated read staff" ON staff FOR SELECT TO authenticated USING (true);
