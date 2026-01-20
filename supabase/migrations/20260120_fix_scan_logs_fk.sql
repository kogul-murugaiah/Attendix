-- Drop the incorrect Foreign Key pointing to 'participants'
ALTER TABLE scan_logs
DROP CONSTRAINT IF EXISTS scan_logs_participant_id_fkey;

-- Add the correct Foreign Key pointing to 'student_registrations'
ALTER TABLE scan_logs
ADD CONSTRAINT scan_logs_participant_id_fkey
FOREIGN KEY (participant_id)
REFERENCES student_registrations(id)
ON DELETE CASCADE;
