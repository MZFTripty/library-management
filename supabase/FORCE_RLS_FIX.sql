-- FORCE DROP AND RECREATE ALL RLS POLICIES
-- This version will work even if policies already exist

-- ============================================
-- STEP 1: Fix the is_admin() function
-- ============================================
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

-- ============================================
-- STEP 2: FORCE DROP ALL EXISTING POLICIES
-- ============================================

-- Drop all users table policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
    DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
    DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
    DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop all book_shelves policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view book shelves" ON public.book_shelves;
    DROP POLICY IF EXISTS "Only admins can manage book shelves" ON public.book_shelves;
    DROP POLICY IF EXISTS "Admins can insert book shelves" ON public.book_shelves;
    DROP POLICY IF EXISTS "Admins can update book shelves" ON public.book_shelves;
    DROP POLICY IF EXISTS "Admins can delete book shelves" ON public.book_shelves;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop all books policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
    DROP POLICY IF EXISTS "Only admins can manage books" ON public.books;
    DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
    DROP POLICY IF EXISTS "Admins can update books" ON public.books;
    DROP POLICY IF EXISTS "Admins can delete books" ON public.books;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop all borrow_records policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Members can view their own borrow records" ON public.borrow_records;
    DROP POLICY IF EXISTS "Admins can view all borrow records" ON public.borrow_records;
    DROP POLICY IF EXISTS "Only admins can manage borrow records" ON public.borrow_records;
    DROP POLICY IF EXISTS "Members can insert borrow records" ON public.borrow_records;
    DROP POLICY IF EXISTS "Admins can insert borrow records" ON public.borrow_records;
    DROP POLICY IF EXISTS "Admins can update borrow records" ON public.borrow_records;
    DROP POLICY IF EXISTS "Admins can delete borrow records" ON public.borrow_records;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop all fines policies
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Members can view their own fines" ON public.fines;
    DROP POLICY IF EXISTS "Admins can view all fines" ON public.fines;
    DROP POLICY IF EXISTS "Only admins can manage fines" ON public.fines;
    DROP POLICY IF EXISTS "Admins can insert fines" ON public.fines;
    DROP POLICY IF EXISTS "Admins can update fines" ON public.fines;
    DROP POLICY IF EXISTS "Members can update their own fines" ON public.fines;
    DROP POLICY IF EXISTS "Admins can delete fines" ON public.fines;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- STEP 3: CREATE NEW POLICIES
-- ============================================

-- USERS table policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- BOOK_SHELVES table policies
CREATE POLICY "Anyone can view book shelves"
    ON public.book_shelves FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Admins can insert book shelves"
    ON public.book_shelves FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update book shelves"
    ON public.book_shelves FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete book shelves"
    ON public.book_shelves FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- BOOKS table policies
CREATE POLICY "Anyone can view books"
    ON public.books FOR SELECT
    TO authenticated, anon
    USING (true);

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

-- BORROW_RECORDS table policies
CREATE POLICY "Members can view their own borrow records"
    ON public.borrow_records FOR SELECT
    USING (member_id = auth.uid());

CREATE POLICY "Admins can view all borrow records"
    ON public.borrow_records FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Members can insert borrow records"
    ON public.borrow_records FOR INSERT
    TO authenticated
    WITH CHECK (member_id = auth.uid());

CREATE POLICY "Admins can insert borrow records"
    ON public.borrow_records FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update borrow records"
    ON public.borrow_records FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete borrow records"
    ON public.borrow_records FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- FINES table policies
CREATE POLICY "Members can view their own fines"
    ON public.fines FOR SELECT
    USING (member_id = auth.uid());

CREATE POLICY "Admins can view all fines"
    ON public.fines FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can insert fines"
    ON public.fines FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update fines"
    ON public.fines FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Members can update their own fines"
    ON public.fines FOR UPDATE
    TO authenticated
    USING (member_id = auth.uid())
    WITH CHECK (member_id = auth.uid());

CREATE POLICY "Admins can delete fines"
    ON public.fines FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- VERIFICATION
-- ============================================

-- Check your current role
SELECT id, email, name, role FROM public.users WHERE id = auth.uid();

-- Verify all policies are created
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd, policyname;
