-- Force unlock all event preference fields
-- This ensures that admins can delete, rename, or change the 'required' status
-- of any field that was automatically created with the 'event_' prefix.
UPDATE public.form_fields
SET is_locked = false, is_core_field = false
WHERE field_name LIKE 'event_%';
