-- Updated Backfill/Reset Script
-- 1. Updates the `create_default_registration_form` function for FUTURE orgs.
-- 2. Resets and updates the form for EXISTING orgs to match the new requirement.

-- Part 1: Update the Function for Future
CREATE OR REPLACE FUNCTION create_default_registration_form()
RETURNS TRIGGER AS $$
DECLARE
  new_form_id UUID;
BEGIN
  INSERT INTO registration_forms (organization_id, name, is_active, created_by)
  VALUES (NEW.id, 'Default Registration Form', true, NEW.assigned_by)
  RETURNING id INTO new_form_id;
  
  -- Add ALL Core Fields (Locked)
  INSERT INTO form_fields (form_id, field_name, field_label, field_type, is_required, is_core_field, is_locked, display_order, field_options)
  VALUES
    (new_form_id, 'full_name', 'Full Name', 'text', true, true, true, 1, null),
    (new_form_id, 'register_number', 'Register Number', 'text', true, true, true, 2, null),
    (new_form_id, 'phone', 'Mobile Number', 'tel', true, true, true, 3, null), -- User said necessary
    (new_form_id, 'email', 'Email Address', 'email', true, true, true, 4, null),
    (new_form_id, 'college_name', 'College Name', 'text', true, true, true, 5, null),
    (new_form_id, 'department', 'Department', 'text', true, true, true, 6, null),
    (new_form_id, 'year_of_study', 'Year of Study', 'select', true, true, true, 7, '["1st Year", "2nd Year", "3rd Year", "4th Year", "PG", "Other"]'::jsonb),
    -- Events will be handled specially by frontend, but we define them here to appear in the form
    (new_form_id, 'event_1', 'Event Preference 1', 'select', true, true, true, 8, '["-- Dynamic --"]'::jsonb),
    (new_form_id, 'event_2', 'Event Preference 2', 'select', true, true, true, 9, '["-- Dynamic --"]'::jsonb),
    (new_form_id, 'event_3', 'Event Preference 3', 'select', true, true, true, 10, '["-- Dynamic --"]'::jsonb);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Part 2: Fix Existing Orgs
DO $$
DECLARE
  org RECORD;
  form_rec RECORD;
  new_form_id UUID;
BEGIN
  FOR org IN SELECT * FROM organizations LOOP
    
    -- Check if form exists
    SELECT id INTO new_form_id FROM registration_forms WHERE organization_id = org.id AND is_active = true;
    
    -- If not exists, create it
    IF new_form_id IS NULL THEN
        INSERT INTO registration_forms (organization_id, name, is_active, created_by)
        VALUES (org.id, 'Default Registration Form', true, org.assigned_by)
        RETURNING id INTO new_form_id;
    END IF;

    -- DELETE EXISTING FIELDS to reset to new default (Dev only - in prod we might merge)
    -- User wants to ensure these default details are present.
    DELETE FROM form_fields WHERE form_id = new_form_id AND is_core_field = true; 
    -- We keep custom fields if any? No, let's just reset core fields.
    -- Actually, to avoid duplicates if I run this multiple times, deleting core fields is safe.

    -- Re-insert Core Fields
    INSERT INTO form_fields (form_id, field_name, field_label, field_type, is_required, is_core_field, is_locked, display_order, field_options)
    VALUES
        (new_form_id, 'full_name', 'Full Name', 'text', true, true, true, 1, null),
        (new_form_id, 'register_number', 'Register Number', 'text', true, true, true, 2, null),
        (new_form_id, 'phone', 'Mobile Number', 'tel', true, true, true, 3, null),
        (new_form_id, 'email', 'Email Address', 'email', true, true, true, 4, null),
        (new_form_id, 'college_name', 'College Name', 'text', true, true, true, 5, null),
        (new_form_id, 'department', 'Department', 'text', true, true, true, 6, null),
        (new_form_id, 'year_of_study', 'Year of Study', 'select', true, true, true, 7, '["1st Year", "2nd Year", "3rd Year", "4th Year", "PG", "Other"]'::jsonb),
        (new_form_id, 'event_1', 'Event Preference 1', 'select', true, true, true, 8, '["-- Dynamic --"]'::jsonb),
        (new_form_id, 'event_2', 'Event Preference 2', 'select', true, true, true, 9, '["-- Dynamic --"]'::jsonb),
        (new_form_id, 'event_3', 'Event Preference 3', 'select', true, true, true, 10, '["-- Dynamic --"]'::jsonb)
    ON CONFLICT (form_id, field_name) DO NOTHING;
        
  END LOOP;
END;
$$;
