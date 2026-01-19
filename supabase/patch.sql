-- PATCH SCRIPT: Run this to ensure your database is fully set up if the previous scripts failed midway.

-- 1. Ensure Function exists (replace if exists)
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

-- 2. Ensure RLS Policy is correct (Public can register)
DROP POLICY IF EXISTS "Public can register" ON participants;
CREATE POLICY "Public can register" ON participants
  FOR INSERT TO public WITH CHECK (true);

-- 3. Ensure other policies exist (Drop and recreate to be safe)
DROP POLICY IF EXISTS "Staff can view participants" ON participants;
CREATE POLICY "Staff can view participants" ON participants
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid())
  );

-- Re-enable RLS just in case
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- 4. Ensure Indexes (IF NOT EXISTS is not standard in postgres for INDEX unless newer version, 
-- but normally indexes are separate. We can skip if not critical or use DO block. 
-- Let's ignore indexes for now, getting the logic working is key.)

-- 5. Fix potential missing sequence or constraints? 
-- The tables 'participants' and 'events' likely exist.
-- If 'staff' table doesn't exist, you might need to run the CREATE TABLE part for it manually, 
-- but assuming you got RLS errors, the tables likely exist.
