-- FIX: Remove duplicate staff records for the same User ID
-- The error occurs because .single() fails when multiple rows are returned.

-- 1. Delete the OLD entry (Aditya Admin / admin@test.com) sharing the same UUID
DELETE FROM staff 
WHERE user_id = '21b718f9-a9b5-4e12-90d1-a6e19654da53' 
AND email = 'admin@test.com';

-- 2. (Optional but recommended) Add a constraint to prevent this in future
ALTER TABLE staff ADD CONSTRAINT staff_user_id_key UNIQUE (user_id);
