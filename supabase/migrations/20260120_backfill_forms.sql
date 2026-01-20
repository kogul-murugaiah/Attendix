-- Backfill Script: Create default registration forms for existing organizations
-- This is needed because the trigger only runs on NEW organization creation.

DO $$
DECLARE
  org RECORD;
  new_form_id UUID;
BEGIN
  -- Loop through all organizations that DO NOT have an active registration form
  FOR org IN 
    SELECT * FROM organizations 
    WHERE id NOT IN (SELECT organization_id FROM registration_forms WHERE is_active = true) 
  LOOP
    
    -- 1. Create the Form
    INSERT INTO registration_forms (organization_id, name, is_active, created_by)
    VALUES (org.id, 'Default Registration Form', true, org.assigned_by)
    RETURNING id INTO new_form_id;

    -- 2. Create Default Fields
    INSERT INTO form_fields (form_id, field_name, field_label, field_type, is_required, is_core_field, is_locked, display_order)
    VALUES
        (new_form_id, 'first_name', 'First Name', 'text', true, true, true, 1),
        (new_form_id, 'last_name', 'Last Name', 'text', true, true, true, 2),
        (new_form_id, 'email', 'Email Address', 'email', true, true, true, 3),
        (new_form_id, 'phone', 'Phone Number', 'tel', false, true, true, 4);
        
    RAISE NOTICE 'Created default form for org: % (Code: %)', org.org_name, org.org_code;
  END LOOP;
END;
$$;
