-- Enable Realtime for student_registrations
ALTER PUBLICATION supabase_realtime ADD TABLE student_registrations;

-- Also verify replica identity (optional but good for updates)
ALTER TABLE student_registrations REPLICA IDENTITY FULL;
