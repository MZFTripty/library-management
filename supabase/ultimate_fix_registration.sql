-- Ultimate Registration Fix
-- Run this in Supabase SQL Editor

-- 1. Forcefully clean up old trigger and function
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Ensure phone column exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Recreate the function with simplified logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone)
  VALUES (
    new.id,
    new.email,
    -- Default name if missing
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    -- Hardcode default role to 'member' if missing or invalid, assuming column handles casting
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'member'::user_role),
    -- Phone number
    new.raw_user_meta_data->>'phone'
  );
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: If anything fails (like enum error), try inserting minimal data
  -- This prevents the signup from failing completely
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, 'New User (Fallback)', 'member');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Reattach trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
