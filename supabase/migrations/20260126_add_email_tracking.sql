-- Add email tracking columns to student_registrations
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed'));
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS email_error TEXT;
ALTER TABLE student_registrations ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Add email tracking columns to participants (backup/legacy table)
ALTER TABLE participants ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'failed'));
ALTER TABLE participants ADD COLUMN IF NOT EXISTS email_error TEXT;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;

-- Index for quick lookups of unsent emails
CREATE INDEX IF NOT EXISTS idx_student_registrations_email_status ON student_registrations(email_status) WHERE email_status != 'sent';
CREATE INDEX IF NOT EXISTS idx_participants_email_status ON participants(email_status) WHERE email_status != 'sent';
