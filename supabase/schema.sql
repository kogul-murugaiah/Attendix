-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Events Table (Create first as it is referenced by others)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_code TEXT UNIQUE NOT NULL,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL,
  venue TEXT NOT NULL,
  event_datetime TIMESTAMPTZ NOT NULL,
  manager_name TEXT,
  manager_email TEXT,
  max_capacity INTEGER,
  current_attendance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Participants Table
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_code TEXT UNIQUE NOT NULL, -- e.g., "SYM2024-001"
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  college TEXT NOT NULL,
  department TEXT NOT NULL,
  year_of_study TEXT NOT NULL,
  registration_datetime TIMESTAMPTZ DEFAULT NOW(),
  qr_code_data TEXT NOT NULL, -- stores the participant_code
  gate_entry_status BOOLEAN DEFAULT FALSE,
  gate_entry_timestamp TIMESTAMPTZ,
  event1_id UUID REFERENCES events(id),
  event1_attendance BOOLEAN DEFAULT FALSE,
  event1_timestamp TIMESTAMPTZ,
  event2_id UUID REFERENCES events(id),
  event2_attendance BOOLEAN DEFAULT FALSE,
  event2_timestamp TIMESTAMPTZ,
  event3_id UUID REFERENCES events(id),
  event3_attendance BOOLEAN DEFAULT FALSE,
  event3_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staff Table
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('gate_volunteer', 'event_manager', 'admin')),
  assigned_event_id UUID REFERENCES events(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Scan Logs Table
CREATE TABLE scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES participants(id),
  scanned_by UUID REFERENCES staff(id),
  scan_type TEXT NOT NULL CHECK (scan_type IN ('gate_entry', 'event_attendance')),
  event_id UUID REFERENCES events(id),
  scan_timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'already_scanned', 'not_eligible', 'entry_not_confirmed', 'invalid_qr')),
  error_message TEXT
);

-- Indexes
CREATE INDEX idx_participants_code ON participants(participant_code);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_scan_logs_participant ON scan_logs(participant_id);
CREATE INDEX idx_scan_logs_timestamp ON scan_logs(scan_timestamp);
CREATE INDEX idx_staff_role ON staff(role);

-- RLS Policies
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;

-- Participants policies
CREATE POLICY "Public can register" ON participants
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Staff can view participants" ON participants
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid())
  );

CREATE POLICY "Staff can update participants" ON participants
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid())
  );

-- Events policies
CREATE POLICY "Public can view events" ON events
  FOR SELECT TO anon USING (true);

CREATE POLICY "Admin can manage events" ON events
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.role = 'admin')
  );

-- Staff policies
CREATE POLICY "Users can view own staff record" ON staff
  FOR SELECT TO authenticated USING (user_id = auth.uid());
  
-- Also allow admins to view/manage all staff
CREATE POLICY "Admin can manage staff" ON staff
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.role = 'admin')
  );

-- Scan Logs policies
CREATE POLICY "Staff can create scan logs" ON scan_logs
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid())
  );

CREATE POLICY "Staff can view scan logs" ON scan_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid())
  );

-- Functions

-- Increment attendance
CREATE OR REPLACE FUNCTION increment_event_attendance(event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE events 
  SET current_attendance = current_attendance + 1 
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Generate participant code (simple version)
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
