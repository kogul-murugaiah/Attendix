-- Add explicit columns to student_registrations
ALTER TABLE "student_registrations"
ADD COLUMN IF NOT EXISTS "college" TEXT,
ADD COLUMN IF NOT EXISTS "department" TEXT,
ADD COLUMN IF NOT EXISTS "year_of_study" TEXT,
ADD COLUMN IF NOT EXISTS "event1_id" UUID,
ADD COLUMN IF NOT EXISTS "event2_id" UUID,
ADD COLUMN IF NOT EXISTS "event3_id" UUID,
ADD COLUMN IF NOT EXISTS "event1_attendance" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "event2_attendance" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "event3_attendance" BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "event1_timestamp" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "event2_timestamp" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "event3_timestamp" TIMESTAMPTZ;

-- Backfill data from custom_data
UPDATE student_registrations
SET
  college = COALESCE(custom_data->>'college', custom_data->>'college_name'),
  department = custom_data->>'department',
  year_of_study = COALESCE(custom_data->>'year', custom_data->>'year_of_study'),
  event1_id = (custom_data->>'event_1')::UUID,
  event2_id = (custom_data->>'event_2')::UUID,
  event3_id = (custom_data->>'event_3')::UUID,
  event1_attendance = COALESCE((custom_data->>'event1_attendance')::BOOLEAN, FALSE),
  event2_attendance = COALESCE((custom_data->>'event2_attendance')::BOOLEAN, FALSE),
  event3_attendance = COALESCE((custom_data->>'event3_attendance')::BOOLEAN, FALSE),
  event1_timestamp = (custom_data->>'event1_timestamp')::TIMESTAMPTZ,
  event2_timestamp = (custom_data->>'event2_timestamp')::TIMESTAMPTZ,
  event3_timestamp = (custom_data->>'event3_timestamp')::TIMESTAMPTZ;

-- Ensure scan_logs table exists (referenced in code)
CREATE TABLE IF NOT EXISTS scan_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES student_registrations(id) ON DELETE CASCADE,
    scanned_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    scan_type TEXT NOT NULL, -- 'gate_entry', 'event_attendance', 'manual_remove'
    event_id UUID REFERENCES events(id) ON DELETE SET NULL, -- Null for gate entry
    status TEXT NOT NULL, -- 'success', 'error', 'removed'
    scan_timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Index for realtime performance
CREATE INDEX IF NOT EXISTS idx_student_regs_event1 ON student_registrations(event1_id);
CREATE INDEX IF NOT EXISTS idx_student_regs_event2 ON student_registrations(event2_id);
CREATE INDEX IF NOT EXISTS idx_student_regs_event3 ON student_registrations(event3_id);
