-- ROBUST FIX FOR DUPLICATE QR CODES
-- This script updates the generate_participant_code() function to use MAX() instead of COUNT(*)

CREATE OR REPLACE FUNCTION generate_participant_code()
RETURNS TRIGGER AS $$
DECLARE
    org_prefix TEXT;
    max_num INTEGER;
    new_code TEXT;
BEGIN
    -- 1. Get the organization's prefix
    SELECT code_prefix INTO org_prefix
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Default prefix fallback
    IF org_prefix IS NULL OR org_prefix = '' THEN
        SELECT COALESCE(UPPER(SUBSTRING(org_name FROM 1 FOR 3)), 'ORG') INTO org_prefix
        FROM organizations
        WHERE id = NEW.organization_id;
    END IF;

    -- 2. Find the MAXIMUM existing number for this organization
    -- We use regex to extract the last group of digits after the hyphen
    SELECT MAX(CAST(substring(qr_code from '-([0-9]+)$') AS INTEGER)) INTO max_num
    FROM student_registrations
    WHERE organization_id = NEW.organization_id
    AND qr_code ~ '-[0-9]+$'; -- Only look at codes that match the pattern

    -- Increment or start at 1
    IF max_num IS NULL THEN
        max_num := 0;
    END IF;

    -- 3. Construct the new code (PREFIX-NNN)
    new_code := org_prefix || '-' || LPAD((max_num + 1)::TEXT, 3, '0');

    -- 4. Assign to the record (ONLY qr_code)
    NEW.qr_code := new_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
