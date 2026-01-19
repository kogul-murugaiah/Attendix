-- FINAL FIX SCRIPT
-- Run this entire script in Supabase SQL Editor.

-- 1. Reset RLS on Participants to be fully open for registration
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can register" ON participants;
DROP POLICY IF EXISTS "Enable insert for all" ON participants;

-- Allow ANYONE (Public = Anon + Helper + Auth) to Insert
CREATE POLICY "Enable insert for all" ON participants
  FOR INSERT TO public WITH CHECK (true);

-- Allow ANYONE to Select (Just to be safe for debugging)
DROP POLICY IF EXISTS "Enable select for all" ON participants;
CREATE POLICY "Enable select for all" ON participants
  FOR SELECT TO public USING (true);


-- 2. Ensure Events are viewable by everyone
DROP POLICY IF EXISTS "Public can view events" ON events;
CREATE POLICY "Public can view events" ON events
  FOR SELECT TO public USING (true);


-- 3. Confirm Staff Policy
DROP POLICY IF EXISTS "Public can view staff" ON staff;
-- Staff should only be viewable by themselves or admins, but for login check we usually select by user_id
-- The existing policy "Users can view own staff record" is good.


-- DB INTEGRITY CHECKS (Do not fail if they exist)

-- Sequences/Functions
CREATE OR REPLACE FUNCTION generate_participant_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO counter FROM participants;
  new_code := 'SYM2024-' || LPAD(counter::TEXT, 4, '0');
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_event_attendance(event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events 
  SET current_attendance = current_attendance + 1 
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;
