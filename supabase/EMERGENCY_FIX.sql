-- EMERGENCY FIX: Run this IMMEDIATELY in Supabase SQL Editor
-- This will allow you to add books right now

-- Option 1: Temporarily disable RLS on books table (FASTEST)
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;

-- After running the above, you can add books immediately.
-- Once you verify it works, run the proper fix below:

/*
-- Option 2: Proper Fix (run this after testing)
-- Re-enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Fix is_admin function
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

-- Drop old policies
DROP POLICY IF EXISTS "Only admins can manage books" ON public.books;
DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;

-- Create new policies
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
*/
