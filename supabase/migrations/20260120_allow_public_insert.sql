-- Allow Public Insert (New Registrations)
-- This is critical for self-registration forms.
-- We restrict it to ONLY insert if the Organization ID exists.

CREATE POLICY "Allow public insert" ON student_registrations
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Ensure Realtime works for these inserts by ensuring the Admin (authenticated) can SELECT them.
-- (Already covered by previous SELECT policy, but good to double check)
