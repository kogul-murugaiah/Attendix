-- Migration to add email_template column to organizations table
ALTER TABLE organizations 
ADD COLUMN email_template TEXT DEFAULT NULL;
