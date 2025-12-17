-- Comprehensive RLS Fix for Books Table
-- This script fixes both the RLS policies AND the is_admin() function

-- Step 1: Fix the is_admin() function with proper search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    current_role user_role;
BEGIN
    SELECT role INTO current_role
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN current_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Step 2: Drop existing books policies
DROP POLICY IF EXISTS "Only admins can manage books" ON public.books;
DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;

-- Step 3: Create new policies with explicit INSERT, UPDATE, DELETE
CREATE POLICY "Admins can insert books"
    ON public.books FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update books"
    ON public.books FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete books"
    ON public.books FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- Step 4: Verify the current user is admin
-- This will show your role - you should see 'admin'
SELECT id, email, name, role FROM public.users WHERE id = auth.uid();
