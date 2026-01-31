-- Final Trigger Logic for Duplicate-Proof Code Generation
-- Fallback: Use first 3 letters of Org Name if no custom prefix is set.

CREATE OR REPLACE FUNCTION generate_participant_code()
RETURNS TRIGGER AS $$
DECLARE
    org_prefix TEXT;
    org_nm TEXT;
    max_number INTEGER;
    new_code TEXT;
BEGIN
    -- 1. Get the organization's explicit prefix and its name
    SELECT code_prefix, org_name INTO org_prefix, org_nm
    FROM organizations
    WHERE id = NEW.organization_id;

    -- 2. Fallback Logic: Use first 3 letters of Org Name if no explicit prefix is set
    IF org_prefix IS NULL OR org_prefix = '' THEN
        org_prefix := COALESCE(UPPER(SUBSTRING(org_nm FROM 1 FOR 3)), 'ORG');
    END IF;

    -- 3. Find the MAXIMUM sequence number used so far for this organization and prefix
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

    -- 4. Generate the new code: PREFIX-NNN
    new_code := org_prefix || '-' || LPAD((max_number + 1)::TEXT, 3, '0');

    -- Assign ONLY to qr_code
    NEW.qr_code := new_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
