-- Create event_registrations table (Many-to-Many)
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID REFERENCES student_registrations(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    attendance_status BOOLEAN DEFAULT FALSE,
    scanned_at TIMESTAMPTZ,
    scanned_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(participant_id, event_id) -- Prevent duplicate registration for same event
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_event_regs_participant ON event_registrations(participant_id);
CREATE INDEX IF NOT EXISTS idx_event_regs_event ON event_registrations(event_id);

-- Migrate existing Data (From Columns)
-- Event 1
INSERT INTO event_registrations (participant_id, event_id, attendance_status, scanned_at)
SELECT id, event1_id, event1_attendance, event1_timestamp
FROM student_registrations
WHERE event1_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Event 2
INSERT INTO event_registrations (participant_id, event_id, attendance_status, scanned_at)
SELECT id, event2_id, event2_attendance, event2_timestamp
FROM student_registrations
WHERE event2_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Event 3
INSERT INTO event_registrations (participant_id, event_id, attendance_status, scanned_at)
SELECT id, event3_id, event3_attendance, event3_timestamp
FROM student_registrations
WHERE event3_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Clean up student_registrations (Optional, but good for clarity later)
-- We KEEP college, department, etc. as they are 1-to-1 attributes.
-- We DROP the event columns as they are now normalized.
ALTER TABLE student_registrations
DROP COLUMN IF EXISTS event1_id,
DROP COLUMN IF EXISTS event2_id,
DROP COLUMN IF EXISTS event3_id,
DROP COLUMN IF EXISTS event1_attendance,
DROP COLUMN IF EXISTS event2_attendance,
DROP COLUMN IF EXISTS event3_attendance,
DROP COLUMN IF EXISTS event1_timestamp,
DROP COLUMN IF EXISTS event2_timestamp,
DROP COLUMN IF EXISTS event3_timestamp;

-- Clean up custom_data (Remove event fields from JSON)
-- This is a bit complex in SQL to remove keys safely, but for now we can rely on apps ignoring them.
-- Or we can update:
UPDATE student_registrations
SET custom_data = custom_data - 'event_1' - 'event_2' - 'event_3' - 'event1_attendance' - 'event2_attendance' - 'event3_attendance' - 'event_preference_1' - 'event_preference_2' - 'event_preference_3';
