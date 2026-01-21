-- Fix RLS: Allow Staff with 'admin' role to manage form fields
-- Currently only 'organization_admins' (owners) can manage fields.

DROP POLICY IF EXISTS "Staff admins manage fields" ON form_fields;

CREATE POLICY "Staff admins manage fields" ON form_fields
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM registration_forms 
      JOIN staff ON staff.organization_id = registration_forms.organization_id
      WHERE registration_forms.id = form_fields.form_id
      AND staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'event_manager') -- Allow event managers too? Maybe just admin.
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM registration_forms 
      JOIN staff ON staff.organization_id = registration_forms.organization_id
      WHERE registration_forms.id = form_fields.form_id
      AND staff.user_id = auth.uid()
      AND staff.role IN ('admin', 'event_manager')
    )
  );
