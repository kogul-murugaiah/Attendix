-- Relax Permissions on Staff Table for Debugging
-- This allows any logged-in user to view the staff table (to find their own record)

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own staff record" ON staff;
DROP POLICY IF EXISTS "Allow authenticated read staff" ON staff;

CREATE POLICY "Allow authenticated read staff" ON staff 
FOR SELECT TO authenticated 
USING (true);
