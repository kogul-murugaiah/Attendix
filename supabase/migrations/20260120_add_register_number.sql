-- Add register_number column to student_registrations
ALTER TABLE student_registrations 
ADD COLUMN IF NOT EXISTS register_number TEXT DEFAULT '';

-- Make it NOT NULL after backfilling (optional, but requested as mandatory)
-- For now, we set default empty string to avoid breaking existing rows without it.
UPDATE student_registrations SET register_number = 'UNKNOWN' WHERE register_number IS NULL OR register_number = '';

-- Index for searching
CREATE INDEX IF NOT EXISTS idx_student_register_number ON student_registrations(register_number);
