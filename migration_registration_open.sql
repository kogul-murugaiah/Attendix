-- Add registration_open column to organizations table
ALTER TABLE organizations 
ADD COLUMN registration_open BOOLEAN DEFAULT true;

-- Update existing organizations to have registration open by default
UPDATE organizations 
SET registration_open = true 
WHERE registration_open IS NULL;
