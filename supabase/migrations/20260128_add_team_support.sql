-- Add team support to organizations and registrations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS team_events_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE student_registrations 
ADD COLUMN IF NOT EXISTS team_name TEXT,
ADD COLUMN IF NOT EXISTS registration_group_id UUID;

-- Index for searching teams
CREATE INDEX IF NOT EXISTS idx_student_regs_team_name ON student_registrations(team_name);
CREATE INDEX IF NOT EXISTS idx_student_regs_group_id ON student_registrations(registration_group_id);
