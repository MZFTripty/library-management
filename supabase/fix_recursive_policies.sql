-- Fix for infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor

-- 1. Create a secure function to check if the current user is an admin
-- SECURITY DEFINER means this function runs with the privileges of the creator (postgres/superuser)
-- allowing it to bypass RLS on the users table when checking roles.
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing problematic policies

-- Users policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;

-- Book shelves policies
DROP POLICY IF EXISTS "Only admins can manage book shelves" ON public.book_shelves;

-- Books policies
DROP POLICY IF EXISTS "Only admins can manage books" ON public.books;

-- Borrow records policies
DROP POLICY IF EXISTS "Admins can view all borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Only admins can manage borrow records" ON public.borrow_records;

-- Fines policies
DROP POLICY IF EXISTS "Admins can view all fines" ON public.fines;
DROP POLICY IF EXISTS "Only admins can manage fines" ON public.fines;

-- 3. Re-create policies using the new helper function

-- Users policies
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE
    USING (public.is_admin());

-- Book shelves policies
CREATE POLICY "Only admins can manage book shelves"
    ON public.book_shelves FOR ALL
    USING (public.is_admin());

-- Books policies
CREATE POLICY "Only admins can manage books"
    ON public.books FOR ALL
    USING (public.is_admin());

-- Borrow records policies
CREATE POLICY "Admins can view all borrow records"
    ON public.borrow_records FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Only admins can manage borrow records"
    ON public.borrow_records FOR ALL
    USING (public.is_admin());

-- Fines policies
CREATE POLICY "Admins can view all fines"
    ON public.fines FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Only admins can manage fines"
    ON public.fines FOR ALL
    USING (public.is_admin());
