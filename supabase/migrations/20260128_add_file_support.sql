-- 1. Update form_fields constraint to allow 'file' type
ALTER TABLE form_fields DROP CONSTRAINT IF EXISTS form_fields_field_type_check;
ALTER TABLE form_fields ADD CONSTRAINT form_fields_field_type_check 
  CHECK (field_type IN ('text', 'email', 'tel', 'select', 'textarea', 'number', 'date', 'checkbox', 'radio', 'file'));

-- 2. Storage Setup (Supabase Storage)
-- Create the 'registrations' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('registrations', 'registrations', true)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policies for Storage
-- Allow public read access to the 'registrations' bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'registrations');

-- Allow unauthenticated uploads to the 'registrations' bucket
-- Note: We restrict uploads to the 'registrations' bucket
CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'registrations');

-- Allow authenticated users (staff/admin) to manage their organization's files if needed,
-- but for now, base public access is sufficient for the requested sharing ease.
