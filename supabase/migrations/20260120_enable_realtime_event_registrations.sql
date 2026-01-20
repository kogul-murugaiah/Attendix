-- Add event_registrations to the supabase_realtime publication
BEGIN;
  -- Check if publication exists (standard in Supabase) and add table
  -- If not using a transaction, just the ALTER statement is fine.
  ALTER PUBLICATION supabase_realtime ADD TABLE event_registrations;
COMMIT;
