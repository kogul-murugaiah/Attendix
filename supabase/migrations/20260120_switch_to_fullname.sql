-- Migration: Replace first_name/last_name with full_name in student_registrations

-- 1. Add full_name column
ALTER TABLE student_registrations ADD COLUMN full_name TEXT;

-- 2. Migrate existing data (Legacy data might use first/last)
UPDATE student_registrations 
SET full_name = TRIM(first_name || ' ' || last_name)
WHERE full_name IS NULL;

-- 3. Make full_name NOT NULL (Assuming all registrations must have a name)
-- If data was empty, set a placeholder to avoid error
UPDATE student_registrations SET full_name = 'Unknown' WHERE full_name IS NULL OR full_name = '';
ALTER TABLE student_registrations ALTER COLUMN full_name SET NOT NULL;

-- 4. Drop old columns
ALTER TABLE student_registrations DROP COLUMN first_name;
ALTER TABLE student_registrations DROP COLUMN last_name;

-- 5. Update Registration Form Trigger to ensure defaults match
-- (This just ensures validity, the code itself needs to handle it)
