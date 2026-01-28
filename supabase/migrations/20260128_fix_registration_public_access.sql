-- Allow unauthenticated users to see the registration form details
-- This is required for the public registration page to load the form fields.

CREATE POLICY "Public can view active registration forms" ON registration_forms
  FOR SELECT TO anon
  USING (is_active = true);

-- Update the existing trigger function to be robust against deletions
-- It now finds the MAXIMUM sequence number used so far for the organization's prefix
CREATE OR REPLACE FUNCTION generate_participant_code()
RETURNS TRIGGER AS $$
DECLARE
    org_prefix TEXT;
    max_number INTEGER;
    new_code TEXT;
BEGIN
    -- 1. Get the organization's prefix
    SELECT code_prefix INTO org_prefix
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Default prefix if none set (Fallback)
    IF org_prefix IS NULL OR org_prefix = '' THEN
        SELECT COALESCE(UPPER(SUBSTRING(org_name FROM 1 FOR 3)), 'ORG') INTO org_prefix
        FROM organizations
        WHERE id = NEW.organization_id;
    END IF;

    -- 2. Find the MAXIMUM sequence number used so far for this organization and prefix
    -- We look for codes matching 'PREFIX-%' and extract the numeric part after the hyphen
    SELECT COALESCE(
        MAX(
            CAST(
                substring(qr_code FROM '-([0-9]+)$') 
                AS INTEGER
            )
        ), 
        0
    ) INTO max_number
    FROM student_registrations
    WHERE organization_id = NEW.organization_id
    AND qr_code LIKE org_prefix || '-%';

    -- 3. Generate the new code: PREFIX-NNN
    new_code := org_prefix || '-' || LPAD((max_number + 1)::TEXT, 3, '0');

    -- Assign ONLY to qr_code. register_number is for student-provided ID.
    NEW.qr_code := new_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
