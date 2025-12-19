-- Library Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE borrow_status AS ENUM ('pending', 'borrowed', 'returned', 'overdue', 'rejected');

-- Users table (extends Supabase auth.users)
-- ... (table definitions remain same) ...
-- ...
-- Function to handle new user creation
-- ...
-- Trigger to create user profile on signup
-- ...

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin status (bypassing RLS)
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

-- Users policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;

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

CREATE POLICY "Admins can update users"
    ON public.users FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Book shelves policies (viewable by everyone)
DROP POLICY IF EXISTS "Anyone can view book shelves" ON public.book_shelves;
DROP POLICY IF EXISTS "Only admins can manage book shelves" ON public.book_shelves;

CREATE POLICY "Anyone can view book shelves"
    ON public.book_shelves FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Admins can manage book shelves"
    ON public.book_shelves FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Books policies (viewable by everyone)
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
DROP POLICY IF EXISTS "Only admins can manage books" ON public.books;
DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;
DROP POLICY IF EXISTS "Admins can manage books" ON public.books;

CREATE POLICY "Anyone can view books" 
    ON public.books FOR SELECT 
    USING (true);

CREATE POLICY "Admins can manage books" 
    ON public.books FOR ALL 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());

-- Borrow records policies
DROP POLICY IF EXISTS "Members can view their own borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can view all borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Members can insert borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can insert borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can update borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can delete borrow records" ON public.borrow_records;
DROP POLICY IF EXISTS "Admins can manage borrow records" ON public.borrow_records;

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

-- Fines policies
DROP POLICY IF EXISTS "Members can view their own fines" ON public.fines;
DROP POLICY IF EXISTS "Admins can view all fines" ON public.fines;
DROP POLICY IF EXISTS "Only admins can manage fines" ON public.fines;
DROP POLICY IF EXISTS "Admins can insert fines" ON public.fines;
DROP POLICY IF EXISTS "Admins can update fines" ON public.fines;
DROP POLICY IF EXISTS "Members can update their own fines" ON public.fines;
DROP POLICY IF EXISTS "Admins can delete fines" ON public.fines;
DROP POLICY IF EXISTS "Admins can manage fines" ON public.fines;

CREATE POLICY "Members can view their own fines" 
    ON public.fines FOR SELECT 
    USING (member_id = auth.uid());

CREATE POLICY "Admins can manage fines" 
    ON public.fines FOR ALL 
    USING (public.is_admin()) 
    WITH CHECK (public.is_admin());

-- Insert some sample data
INSERT INTO public.book_shelves (name, location, description, capacity) VALUES
    ('Fiction Section A', 'First Floor, Row 1', 'Classic and contemporary fiction', 150),
    ('Fiction Section B', 'First Floor, Row 2', 'Best sellers and new releases', 150),
    ('Non-Fiction', 'Second Floor, Row 1', 'History, science, and biography', 200),
    ('Reference', 'Ground Floor', 'Encyclopedias and dictionaries', 100),
    ('Children''s Books', 'First Floor, Kids Corner', 'Books for children of all ages', 120);
