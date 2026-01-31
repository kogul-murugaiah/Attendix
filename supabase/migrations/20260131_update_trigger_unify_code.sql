-- Unified Trigger Logic: Participant IDs use 'org_code' column
-- This aligns the UI ("Code Prefix") and DB ("org_code") into a single authoritative source.

CREATE OR REPLACE FUNCTION generate_participant_code()
RETURNS TRIGGER AS $$
DECLARE
    org_prefix TEXT;
    max_number INTEGER;
    new_code TEXT;
BEGIN
    -- 1. Get the organization's code (Authoritative Source)
    SELECT org_code INTO org_prefix
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Safety fallback if org_code is somehow missing
    IF org_prefix IS NULL OR org_prefix = '' THEN
        org_prefix := 'ORG';
    END IF;

    -- Standardize to UPPER for the IDs
    org_prefix := UPPER(org_prefix);

    -- 2. Find the MAXIMUM sequence number used so far for this organization and prefix
    -- This ensures no duplicates even after deletions.
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

    -- Assign to qr_code
    NEW.qr_code := new_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
