-- Enable RLS for scan_logs
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users (Staff, Admins)
CREATE POLICY "Allow read access for authenticated users" ON scan_logs
FOR SELECT TO authenticated
USING (true);

-- Allow insert access for authenticated users (Staff, Admins)
CREATE POLICY "Allow insert access for authenticated users" ON scan_logs
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow updates (unlikely for logs, but safe for now)
CREATE POLICY "Allow update access for authenticated users" ON scan_logs
FOR UPDATE TO authenticated
USING (true);
