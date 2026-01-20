DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_rel 
        WHERE prpubid = (SELECT oid FROM pg_publication WHERE pubname = 'supabase_realtime')
        AND prrelid = 'event_registrations'::regclass
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE event_registrations;
    END IF;
END $$;

-- Set Replica Identity to FULL to ensure all columns (like event_id) are available for filtering
ALTER TABLE event_registrations REPLICA IDENTITY FULL;
