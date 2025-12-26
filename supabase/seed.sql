-- Seed data for Library Management System
-- Run this after initializing the schema

-- 1. Insert default book shelves
INSERT INTO public.book_shelves (name, location, description, capacity) VALUES
    ('Fiction Section A', 'First Floor, Row 1', 'Classic and contemporary fiction', 150),
    ('Fiction Section B', 'First Floor, Row 2', 'Best sellers and new releases', 150),
    ('Non-Fiction', 'Second Floor, Row 1', 'History, science, and biography', 200),
    ('Reference', 'Ground Floor', 'Encyclopedias and dictionaries', 100),
    ('Children''s Books', 'First Floor, Kids Corner', 'Books for children of all ages', 120)
ON CONFLICT DO NOTHING;

-- 2. Insert default system settings
INSERT INTO public.system_settings (key, value) 
VALUES ('fine_rate_per_day', '{"amount": 10}'::jsonb)
ON CONFLICT (key) DO NOTHING;
