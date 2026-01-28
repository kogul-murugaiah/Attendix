-- 1. Update the default form field configuration for FUTURE organizations
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
    (new_form_id, 'phone', 'Mobile Number', 'tel', true, true, true, 3, null),
    (new_form_id, 'email', 'Email Address', 'email', true, true, true, 4, null),
    (new_form_id, 'college_name', 'College Name', 'text', true, true, true, 5, null),
    (new_form_id, 'department', 'Department', 'select', true, true, true, 6, '["Computer Science and Engineering (CSE)", "Information Technology (IT)", "Electronics and Communication Engineering (ECE)", "Electrical and Electronics Engineering (EEE)", "Mechanical Engineering (MECH)", "Civil Engineering (CIVIL)", "Artificial Intelligence and Data Science (AI & DS)", "Artificial Intelligence and Machine Learning (AI & ML)", "Cyber Security", "Biotechnology", "Chemical Engineering", "Bio-Medical Engineering", "Food Technology", "Other (Please specify)"]'::jsonb),
    (new_form_id, 'year_of_study', 'Year of Study', 'select', true, true, true, 7, '["I Year", "II Year", "III Year", "IV Year", "PG", "Other"]'::jsonb),
    (new_form_id, 'event_1', 'Event Preference 1', 'select', true, true, true, 8, '["-- Dynamic --"]'::jsonb),
    (new_form_id, 'event_2', 'Event Preference 2', 'select', true, true, true, 9, '["-- Dynamic --"]'::jsonb),
    (new_form_id, 'event_3', 'Event Preference 3', 'select', true, true, true, 10, '["-- Dynamic --"]'::jsonb);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update existing active registration forms
DO $$
DECLARE
  form_rec RECORD;
BEGIN
  FOR form_rec IN SELECT id FROM registration_forms WHERE is_active = true LOOP
    -- Update Department field for existing forms
    UPDATE form_fields 
    SET 
        field_type = 'select',
        field_options = '["Computer Science and Engineering (CSE)", "Information Technology (IT)", "Electronics and Communication Engineering (ECE)", "Electrical and Electronics Engineering (EEE)", "Mechanical Engineering (MECH)", "Civil Engineering (CIVIL)", "Artificial Intelligence and Data Science (AI & DS)", "Artificial Intelligence and Machine Learning (AI & ML)", "Cyber Security", "Biotechnology", "Chemical Engineering", "Bio-Medical Engineering", "Food Technology", "Other (Please specify)"]'::jsonb
    WHERE form_id = form_rec.id AND field_name = 'department';
  END LOOP;
END;
$$;
