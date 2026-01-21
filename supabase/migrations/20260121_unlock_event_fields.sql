-- UPDATED SCRIPT
-- 1. Update existing fields: Unlock AND Unmark as Core Field
-- We set is_core_field = false to treat them as regular custom fields, allowing full deletion.
UPDATE form_fields
SET is_locked = false, is_core_field = false
WHERE field_name LIKE 'event_%';

-- 2. Update the system logic so future organizations get editable/deletable event fields
CREATE OR REPLACE FUNCTION create_default_registration_form()
RETURNS TRIGGER AS $$
DECLARE
  new_form_id UUID;
BEGIN
  INSERT INTO registration_forms (organization_id, name, is_active, created_by)
  VALUES (NEW.id, 'Default Registration Form', true, NEW.assigned_by)
  RETURNING id INTO new_form_id;
  
  -- Add Core Fields (Fixed)
  INSERT INTO form_fields (form_id, field_name, field_label, field_type, is_required, is_core_field, is_locked, display_order, field_options)
  VALUES
    (new_form_id, 'full_name', 'Full Name', 'text', true, true, true, 1, null),
    (new_form_id, 'register_number', 'Register Number', 'text', true, true, true, 2, null),
    (new_form_id, 'phone', 'Mobile Number', 'tel', true, true, true, 3, null),
    (new_form_id, 'email', 'Email Address', 'email', true, true, true, 4, null),
    (new_form_id, 'college_name', 'College Name', 'text', true, true, true, 5, null),
    (new_form_id, 'department', 'Department', 'text', true, true, true, 6, null),
    (new_form_id, 'year_of_study', 'Year of Study', 'select', true, true, true, 7, '["1st Year", "2nd Year", "3rd Year", "4th Year", "PG", "Other"]'::jsonb);
    
  -- Add Event Fields as CUSTOM FIELDS (is_core_field = FALSE, is_locked = FALSE)
  -- This ensures they behave exactly like other custom fields
  INSERT INTO form_fields (form_id, field_name, field_label, field_type, is_required, is_core_field, is_locked, display_order, field_options)
  VALUES
    (new_form_id, 'event_1', 'Event Preference 1', 'select', true, false, false, 8, '["-- Dynamic --"]'::jsonb),
    (new_form_id, 'event_2', 'Event Preference 2', 'select', true, false, false, 9, '["-- Dynamic --"]'::jsonb),
    (new_form_id, 'event_3', 'Event Preference 3', 'select', true, false, false, 10, '["-- Dynamic --"]'::jsonb);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
