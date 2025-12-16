-- Force Sync and Promote to Admin
-- Run this in your Supabase SQL Editor

-- 1. Upsert all users from auth.users to public.users
-- This ensures that if your user record is missing, it gets created.
INSERT INTO public.users (id, email, name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 
    'admin' -- Force admin role
FROM auth.users
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin', -- Update existing users to admin
    email = EXCLUDED.email;

-- 2. Verify the result
SELECT id, email, role FROM public.users;
