-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow Read Access for Authenticated Users (Staff, Admins)
CREATE POLICY "Allow read access for authenticated users" ON event_registrations
FOR SELECT TO authenticated
USING (true);

-- Policy 2: Allow Insert/Update/Delete for Authenticated Users (Staff, Admins)
CREATE POLICY "Allow write access for authenticated users" ON event_registrations
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 3: Allow Public Read (Optional, if public event pages need to see stats?)
-- For now, keep it private to auth users.
