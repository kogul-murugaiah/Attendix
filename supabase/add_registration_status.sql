-- Add is_registration_open column to events table
ALTER TABLE events 
ADD COLUMN is_registration_open BOOLEAN DEFAULT TRUE;
