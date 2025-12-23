-- Fix Missing Phones & Update Trigger
-- Run this in Supabase SQL Editor

-- 1. SYNC/BACKFILL: Copy phone numbers from Auth Metadata to Public Profile
-- This fixes users who already registered but didn't get their phone saved
UPDATE public.users AS p
SET phone = (a.raw_user_meta_data->>'phone')
FROM auth.users AS a
WHERE p.id = a.id 
  AND (p.phone IS NULL OR p.phone = '')
  AND a.raw_user_meta_data->>'phone' IS NOT NULL;


-- 2. TRIGGER UPDATE: Forcefully ensure the trigger saves phone numbers for NEW users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone)
  VALUES (
    new.id,
    new.email,
    -- Default name
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    -- Default role (safe cast)
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'member'::user_role),
    -- Phone Number (Explicitly extracting it)
    new.raw_user_meta_data->>'phone'
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if main insert crashes (e.g. enum issues)
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, 'New User (Recovery)', 'member');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
