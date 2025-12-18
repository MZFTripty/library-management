-- COMPREHENSIVE RLS FIX FOR ALL TABLES
-- Run this script in Supabase SQL Editor to fix all RLS policy issues

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
-- STEP 2: Fix USERS table policies
-- ============================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (public.is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can update any user
CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================
-- STEP 3: Fix BOOK_SHELVES table policies
-- ============================================
DROP POLICY IF EXISTS "Anyone can view book shelves" ON public.book_shelves;
DROP POLICY IF EXISTS "Only admins can manage book shelves" ON public.book_shelves;

-- Anyone can view book shelves
CREATE POLICY "Anyone can view book shelves"
    ON public.book_shelves FOR SELECT
    TO authenticated, anon
    USING (true);

-- Admins can insert shelves
CREATE POLICY "Admins can insert book shelves"
    ON public.book_shelves FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Admins can update shelves
CREATE POLICY "Admins can update book shelves"
    ON public.book_shelves FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admins can delete shelves
CREATE POLICY "Admins can delete book shelves"
    ON public.book_shelves FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- STEP 4: Fix BOOKS table policies
-- ============================================
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
DROP POLICY IF EXISTS "Only admins can manage books" ON public.books;
DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;

-- Anyone can view books
CREATE POLICY "Anyone can view books"
    ON public.books FOR SELECT
    TO authenticated, anon
    USING (true);

-- Admins can insert books
CREATE POLICY "Admins can insert books"
    ON public.books FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Admins can update books
CREATE POLICY "Admins can update books"
    ON public.books FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admins can delete books
CREATE POLICY "Admins can delete books"
    ON public.books FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- STEP 5: Fix BORROW_RECORDS table policies
-- ============================================
DROP POLICY IF EXISTS "Members can view their own borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can view all borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Only admins can manage borrow records" ON public.borrow_records;

-- Members can view their own borrow records
CREATE POLICY "Members can view their own borrow records"
    ON public.borrow_records FOR SELECT
    USING (member_id = auth.uid());

-- Admins can view all borrow records
CREATE POLICY "Admins can view all borrow records"
    ON public.borrow_records FOR SELECT
    USING (public.is_admin());

-- Members can insert their own borrow records
CREATE POLICY "Members can insert borrow records"
    ON public.borrow_records FOR INSERT
    TO authenticated
    WITH CHECK (member_id = auth.uid());

-- Admins can insert any borrow records
CREATE POLICY "Admins can insert borrow records"
    ON public.borrow_records FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Admins can update borrow records
CREATE POLICY "Admins can update borrow records"
    ON public.borrow_records FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Admins can delete borrow records
CREATE POLICY "Admins can delete borrow records"
    ON public.borrow_records FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- STEP 6: Fix FINES table policies
-- ============================================
DROP POLICY IF EXISTS "Members can view their own fines" ON public.fines;
DROP POLICY IF EXISTS "Admins can view all fines" ON public.fines;
DROP POLICY IF EXISTS "Only admins can manage fines" ON public.fines;

-- Members can view their own fines
CREATE POLICY "Members can view their own fines"
    ON public.fines FOR SELECT
    USING (member_id = auth.uid());

-- Admins can view all fines
CREATE POLICY "Admins can view all fines"
    ON public.fines FOR SELECT
    USING (public.is_admin());

-- Admins can insert fines
CREATE POLICY "Admins can insert fines"
    ON public.fines FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin());

-- Admins can update fines
CREATE POLICY "Admins can update fines"
    ON public.fines FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Members can update their own fines (for payment)
CREATE POLICY "Members can update their own fines"
    ON public.fines FOR UPDATE
    TO authenticated
    USING (member_id = auth.uid())
    WITH CHECK (member_id = auth.uid());

-- Admins can delete fines
CREATE POLICY "Admins can delete fines"
    ON public.fines FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check your current role
SELECT id, email, name, role FROM public.users WHERE id = auth.uid();

-- If you're not an admin, run this to promote yourself:
-- UPDATE public.users SET role = 'admin' WHERE id = auth.uid();

-- Verify all policies are created
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd, policyname;
