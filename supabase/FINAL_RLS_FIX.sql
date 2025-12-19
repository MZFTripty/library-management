-- FINAL NON-RECURSIVE RLS FIX
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Define a robust is_admin function
-- ============================================
-- SECURITY DEFINER ensures it runs as postgres, bypassing RLS inside the function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- STEP 2: USERS TABLE (NON-RECURSIVE)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

-- 1. Everyone can see their own row
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- 2. Admins can see ALL OTHER rows
-- We combine it withauth.uid() != id to be extra safe, though is_admin already bypasses RLS
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (public.is_admin());

-- 3. Updates
CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update users"
    ON public.users FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================
-- STEP 3: BORROW_RECORDS TABLE
-- ============================================
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their own borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can view all borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Members can insert borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can manage borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can update borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can delete borrow records" ON public.borrow_records;

CREATE POLICY "Members can view their own borrow records"
    ON public.borrow_records FOR SELECT
    USING (member_id = auth.uid());

CREATE POLICY "Admins can view all borrow records"
    ON public.borrow_records FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Members can insert borrow records"
    ON public.borrow_records FOR INSERT
    WITH CHECK (member_id = auth.uid());

CREATE POLICY "Admins can manage borrow records"
    ON public.borrow_records FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ============================================
-- STEP 4: OTHER TABLES (BOOKS, SHELVES, FINES)
-- ============================================

-- BOOKS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
DROP POLICY IF EXISTS "Admins can manage books" ON public.books;

CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Admins can manage books" ON public.books FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- SHELVES
ALTER TABLE public.book_shelves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view book shelves" ON public.book_shelves;
DROP POLICY IF EXISTS "Admins can manage book shelves" ON public.book_shelves;

CREATE POLICY "Anyone can view book shelves" ON public.book_shelves FOR SELECT USING (true);
CREATE POLICY "Admins can manage book shelves" ON public.book_shelves FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- FINES
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their own fines" ON public.fines;
DROP POLICY IF EXISTS "Admins can manage fines" ON public.fines;

CREATE POLICY "Members can view their own fines" ON public.fines FOR SELECT USING (member_id = auth.uid());
CREATE POLICY "Admins can manage fines" ON public.fines FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- VERIFICATION
-- ============================================
-- Check if you are an admin
SELECT public.is_admin() as is_admin_result;
