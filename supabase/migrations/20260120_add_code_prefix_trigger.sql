-- Add code_prefix to organizations
ALTER TABLE "organizations" 
ADD COLUMN IF NOT EXISTS "code_prefix" TEXT;

-- Function to generate sequential participant code
CREATE OR REPLACE FUNCTION generate_participant_code()
RETURNS TRIGGER AS $$
DECLARE
    org_prefix TEXT;
    next_number INTEGER;
    new_code TEXT;
BEGIN
    -- Get the organization's prefix
    SELECT code_prefix INTO org_prefix
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Default prefix if none set
    IF org_prefix IS NULL OR org_prefix = '' THEN
        -- Fallback to using first 3 chars of Org Name or "ORG"
        SELECT COALESCE(UPPER(SUBSTRING(org_name FROM 1 FOR 3)), 'ORG') INTO org_prefix
        FROM organizations
        WHERE id = NEW.organization_id;
    END IF;

    -- Count existing registrations for this organization to strictly sequence
    -- Note: This might have race conditions in high concurrency but sufficient for this scale.
    -- Better approach: Use a sequence per org, but that's complex to manage dynamically.
    -- Alternative: Count(*) + 1. 
    -- Locking the table or using an explicit sequence table is better but for now Count + 1 is requested logic.
    
    SELECT count(*) + 1 INTO next_number
    FROM student_registrations
    WHERE organization_id = NEW.organization_id;

    -- Format: PREFIX-001
    new_code := org_prefix || '-' || LPAD(next_number::TEXT, 3, '0');

    -- Assign to NEW.qr_code (This is the actual column name)
    NEW.qr_code := new_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before insert
DROP TRIGGER IF EXISTS trigger_generate_participant_code ON student_registrations;

CREATE TRIGGER trigger_generate_participant_code
BEFORE INSERT ON student_registrations
FOR EACH ROW
EXECUTE FUNCTION generate_participant_code();
