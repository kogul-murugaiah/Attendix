-- Seed Events for Testing
INSERT INTO events (event_code, event_name, category, venue, event_datetime, max_capacity, manager_email) VALUES
('EVT-001', 'Event 1', 'Technical', 'Hall A', NOW() + INTERVAL '1 day', 100, 'manager1@test.com'),
('EVT-002', 'Event 2', 'Workshop', 'Lab 1', NOW() + INTERVAL '1 day', 50, 'manager2@test.com'),
('EVT-003', 'Event 3', 'Seminar', 'Auditorium', NOW() + INTERVAL '2 days', 200, 'manager3@test.com'),
('EVT-004', 'Event 4', 'Coding', 'Lab 2', NOW() + INTERVAL '2 days', 60, 'manager1@test.com'),
('EVT-005', 'Event 5', 'Gaming', 'Recreation Room', NOW() + INTERVAL '3 days', 40, 'manager2@test.com'),
('EVT-006', 'Event 6', 'Hackathon', 'Main Hall', NOW() + INTERVAL '3 days', 150, 'manager3@test.com');

-- Optional: Create a test Admin user (Note: This only creates the Staff record, you must create the Auth User separately or use the API)
-- INSERT INTO staff (name, email, role, user_id) VALUES ('Admin User', 'admin@example.com', 'admin', 'UUID_FROM_AUTH_USERS_TABLE');
