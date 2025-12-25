-- Fix Social Login Name & Avatar Sync
-- Run this in your Supabase SQL Editor

-- 1. Ensure columns exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Update the sync function to handle Google/Social metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      'New User'
    ),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'member'::user_role),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Robust fallback that still tries to save basic info
  INSERT INTO public.users (id, email, name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    'member',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. SYNC EXISTING USERS: Fix users already stuck with "New User (Recovery)"
UPDATE public.users AS p
SET 
  name = COALESCE(a.raw_user_meta_data->>'full_name', a.raw_user_meta_data->>'name', p.name),
  avatar_url = COALESCE(a.raw_user_meta_data->>'avatar_url', p.avatar_url)
FROM auth.users AS a
WHERE p.id = a.id 
  AND (p.name LIKE 'New User%' OR p.avatar_url IS NULL);
