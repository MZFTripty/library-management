-- Add phone column to users table and update user creation function

-- 1. Add phone column to public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update the handle_new_user function to map phone from metadata
-- This relies on the frontend sending 'phone' in valid metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'member'),
    new.raw_user_meta_data->>'phone'  -- Map phone from metadata
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
