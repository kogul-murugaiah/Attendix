-- Create storage bucket for organization assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
-- Allow public read access to all files in the bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'organization-assets');

-- Allow authenticated users (Org Admins/Staff) to upload
-- Ideally we check org ownership, but basic auth check is a good start for V1
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'organization-assets' AND auth.role() = 'authenticated');

-- Allow authenticated users to update/delete (overwrite logo)
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'organization-assets' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE USING (bucket_id = 'organization-assets' AND auth.role() = 'authenticated');
