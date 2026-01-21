-- Comprehensive RLS Fix for form_fields
-- This script resets the permissions for managing form fields to ensure you can DELETE them.

-- 1. Fix Policy for Organization Owners
DROP POLICY IF EXISTS "Org admins manage fields" ON form_fields;
DROP POLICY IF EXISTS "Org admins manage fields (ALL)" ON form_fields; -- cleanup potential dupes

CREATE POLICY "Org admins manage fields" ON form_fields
  FOR ALL TO authenticated
  USING (
    EXISTS (
        SELECT 1 FROM registration_forms 
        JOIN organization_admins ON organization_admins.organization_id = registration_forms.organization_id
        WHERE registration_forms.id = form_fields.form_id
        AND organization_admins.user_id = auth.uid()
    )
  );

-- 2. Fix Policy for Staff Admins
DROP POLICY IF EXISTS "Staff admins manage fields" ON form_fields;

CREATE POLICY "Staff admins manage fields" ON form_fields
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registration_forms 
      JOIN staff ON staff.organization_id = registration_forms.organization_id
      WHERE registration_forms.id = form_fields.form_id
      AND staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'event_manager')
    )
  );
