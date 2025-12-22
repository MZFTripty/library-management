-- Fix Registration Error
-- Run this entire script in Supabase SQL Editor

-- 1. Ensure phone column exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Drop existing trigger and function to ensure clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Recreate the function with robust error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role := 'member'; -- Default role
BEGIN
  -- Safely check if role is provided and valid, otherwise default to member
  BEGIN
    IF new.raw_user_meta_data->>'role' IS NOT NULL THEN
      v_role := (new.raw_user_meta_data->>'role')::user_role;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_role := 'member';
  END;

  INSERT INTO public.users (id, email, name, role, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    v_role,
    new.raw_user_meta_data->>'phone'
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
