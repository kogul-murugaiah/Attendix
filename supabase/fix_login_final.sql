-- FINAL LOGIN FIX
-- Run this whole script. It handles the "already exists" errors safely.

-- 1. Delete the duplicate dummy admin row (if it exists)
-- We identify it by the email 'admin@test.com' sharing your User ID.
DELETE FROM staff 
WHERE user_id = '21b718f9-a9b5-4e12-90d1-a6e19654da53' 
AND email = 'admin@test.com';

-- 2. Force Open Read Permissions for Staff
-- This ensures your logged-in user can definitely read their own row.
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own staff record" ON staff;
DROP POLICY IF EXISTS "Allow authenticated read staff" ON staff;

CREATE POLICY "Allow authenticated read staff" ON staff 
FOR SELECT TO authenticated 
USING (true);
