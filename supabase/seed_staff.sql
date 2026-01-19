-- SEED STAFF DATA
-- IMPORTANT: You must first create these users in your Supabase Auth (Authentication -> Users -> Add User)
-- Then copy their User UID strings and replace the placeholders below.

-- 1. Create a users in Supabase Auth:
--    - admin@test.com
--    - gate@test.com
--    - manager@test.com

-- 2. Run this script (Replace UUIDs first!)

INSERT INTO staff (name, email, role, user_id, assigned_event_id)
VALUES
(
  'Aditya Admin', 
  'admin@test.com', 
  'admin', 
  '21b718f9-a9b5-4e12-90d1-a6e19654da53', -- <--- Replace this with actual UUID from Supabase Auth
  NULL
  NULL
);

-- (Optional) Add more staff if you create more users:
-- ,(
--   'Ganesh Gatekeeper', 
--   'gate@test.com', 
--   'gate_volunteer', 
--   'PLACEHOLDER_UID_FOR_GATE',
--   NULL
-- ),
-- (
--   'Manoj Manager', 
--   'manager@test.com', 
--   'event_manager', 
--   'PLACEHOLDER_UID_FOR_MANAGER',
--   (SELECT id FROM events ORDER BY created_at LIMIT 1)
-- );
