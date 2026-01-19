-- Drop existing constraints
ALTER TABLE scan_logs DROP CONSTRAINT IF EXISTS scan_logs_scan_type_check;
ALTER TABLE scan_logs DROP CONSTRAINT IF EXISTS scan_logs_status_check;

-- Add updated constraints with more allowed values
ALTER TABLE scan_logs ADD CONSTRAINT scan_logs_scan_type_check 
  CHECK (scan_type IN ('gate_entry', 'event_attendance', 'manual_remove', 'admin_override'));

ALTER TABLE scan_logs ADD CONSTRAINT scan_logs_status_check 
  CHECK (status IN ('success', 'already_scanned', 'not_eligible', 'entry_not_confirmed', 'invalid_qr', 'removed', 'admin_update'));
