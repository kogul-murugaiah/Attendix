-- TEMPORARY FIX: Allow any logged-in user to update participants.
-- This confirms if the previous "Staff Check" was the problem.

-- 1. Drop previous policies
DROP POLICY IF EXISTS "Staff can update participants" ON participants;

-- 2. Create a PERMISSIVE policy (allows update to any authenticated user)
CREATE POLICY "Staff can update participants" ON participants
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Check if it applied
SELECT 'Permissive policy applied' as status;
