-- 1. registration_forms table
CREATE TABLE IF NOT EXISTS registration_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Registration Form',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, is_active) -- Note: PostgreSQL allows multiple nulls if using partial index, but here we likely want only ONE active form per org
);
-- Enforce single active form constraint more strictly if needed, but UNIQUE index with WHERE clause is standard PG
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_form_per_org ON registration_forms(organization_id) WHERE (is_active = true);

-- 2. form_fields table
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'email', 'tel', 'select', 'textarea', 'number', 'date', 'checkbox', 'radio')),
  field_options JSONB,
  is_required BOOLEAN DEFAULT false,
  is_core_field BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  placeholder TEXT,
  help_text TEXT,
  validation_rules JSONB,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(form_id, field_name)
);

-- 3. student_registrations table (enhanced version of participants?)
-- User prompt says 'student_registrations', but we have 'participants'. 
-- Checking existing 'participants' table first. If it serves the same purpose, we should modify it instead of creating a duplicate.
-- However, for strict compliance with the prompt, I will create student_registrations OR check if migration should alter participants.
-- Prompt implies 'student_registrations' is the intended table.
-- Let's check if 'participants' should be deprecated or if this is a replacement.
-- Given 'participants' is already used in code, I will ALIAS 'student_registrations' concepts to 'participants' to avoid breaking existing features, 
-- OR strictly follow the prompt if it's a new feature set.
-- DECISION: The prompt asks for 'student_registrations' table. I will create it. 
-- BUT, typically 'participants' IS the registration table. 
-- Coping with the prompt: I'll create 'student_registrations' as requested.

CREATE TABLE IF NOT EXISTS student_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  form_id UUID REFERENCES registration_forms(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  custom_data JSONB DEFAULT '{}'::jsonb,
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  qr_code TEXT,
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  -- Removed UNIQUE(organization_id, email) to allow registering for different events? 
  -- Prompt has UNIQUE(organization_id, email), effectively allowing only ONE registration per student per org?
  -- That might be limiting (can't register for 2 events). I'll stick to prompt for now.
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_registrations_email_org ON student_registrations(organization_id, email);


-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_registration_forms_org ON registration_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_form ON form_fields(form_id, display_order);
CREATE INDEX IF NOT EXISTS idx_student_registrations_org ON student_registrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_student_registrations_email ON student_registrations(email);

-- 5. RLS Policies
ALTER TABLE registration_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_registrations ENABLE ROW LEVEL SECURITY;

-- registration_forms policies
CREATE POLICY "Org members view forms" ON registration_forms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = registration_forms.organization_id 
      AND organization_admins.user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.organization_id = registration_forms.organization_id 
      AND staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins manage forms" ON registration_forms FOR ALL
  USING (
    EXISTS (
        SELECT 1 FROM organization_admins 
        WHERE organization_admins.organization_id = registration_forms.organization_id 
        AND organization_admins.user_id = auth.uid()
    )
  );

-- form_fields policies
CREATE POLICY "Org members view fields" ON form_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM registration_forms 
      JOIN organization_admins ON organization_admins.organization_id = registration_forms.organization_id
      WHERE registration_forms.id = form_fields.form_id
      AND organization_admins.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM registration_forms 
      JOIN staff ON staff.organization_id = registration_forms.organization_id
      WHERE registration_forms.id = form_fields.form_id
      AND staff.user_id = auth.uid()
    )
  );
  
-- Public view fields (for registration page)
CREATE POLICY "Public view fields for active forms" ON form_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM registration_forms
      WHERE registration_forms.id = form_fields.form_id
      AND registration_forms.is_active = true
    )
  );

CREATE POLICY "Org admins manage fields" ON form_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM registration_forms 
      JOIN organization_admins ON organization_admins.organization_id = registration_forms.organization_id
      WHERE registration_forms.id = form_fields.form_id
      AND organization_admins.user_id = auth.uid()
    )
  );

-- student_registrations policies
CREATE POLICY "Public can register" ON student_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Org members view registrations" ON student_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = student_registrations.organization_id
      AND organization_admins.user_id = auth.uid()
    )
    OR
     EXISTS (
      SELECT 1 FROM staff 
      WHERE staff.organization_id = student_registrations.organization_id
      AND staff.user_id = auth.uid()
    )
  );

CREATE POLICY "Org admins manage registrations" ON student_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_admins 
      WHERE organization_admins.organization_id = student_registrations.organization_id
      AND organization_admins.user_id = auth.uid()
    )
  );

-- 6. Trigger to create default form for new organizations
CREATE OR REPLACE FUNCTION create_default_registration_form()
RETURNS TRIGGER AS $$
DECLARE
  new_form_id UUID;
BEGIN
  INSERT INTO registration_forms (organization_id, name, is_active, created_by)
  VALUES (NEW.id, 'Default Registration Form', true, NEW.assigned_by) -- assigned_by from org, or null
  RETURNING id INTO new_form_id;
  
  -- Add core fields (locked)
  INSERT INTO form_fields (form_id, field_name, field_label, field_type, is_required, is_core_field, is_locked, display_order)
  VALUES
    (new_form_id, 'first_name', 'First Name', 'text', true, true, true, 1),
    (new_form_id, 'last_name', 'Last Name', 'text', true, true, true, 2),
    (new_form_id, 'email', 'Email Address', 'email', true, true, true, 3),
    (new_form_id, 'phone', 'Phone Number', 'tel', false, true, true, 4);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on organizations table
-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS trigger_create_default_form ON organizations;
CREATE TRIGGER trigger_create_default_form
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION create_default_registration_form();
