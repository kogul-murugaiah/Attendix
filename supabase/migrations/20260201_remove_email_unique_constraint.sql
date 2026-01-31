-- Migration: Remove unique constraint on (organization_id, email) in student_registrations
-- This allows participants to register multiple times with the same email.

-- 1. Drop the unique index
DROP INDEX IF EXISTS idx_student_registrations_email_org;

-- 2. Create a standard (non-unique) index for lookup performance
CREATE INDEX IF NOT EXISTS idx_student_registrations_email_org_nonunique 
ON student_registrations(organization_id, email);

-- 3. (Optional) Enhance the email index for general lookups if not already present
CREATE INDEX IF NOT EXISTS idx_student_registrations_email_search 
ON student_registrations(email);
