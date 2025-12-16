-- Promote a user to Admin role
-- Run this in your Supabase SQL Editor

-- Replace 'your_email@example.com' with your actual email address
UPDATE public.users
SET role = 'admin'
WHERE email = 'your_email@example.com';

-- Verify the change
SELECT * FROM public.users WHERE role = 'admin';
