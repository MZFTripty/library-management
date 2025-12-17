-- Diagnostic Script: Check RLS and Admin Status
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if is_admin() function exists and works
SELECT public.is_admin() as am_i_admin;

-- 2. Check current user's role in public.users
SELECT id, email, name, role 
FROM public.users 
WHERE id = auth.uid();

-- 3. List all policies on books table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'books';

-- 4. Test if you can see books (should work)
SELECT COUNT(*) as book_count FROM public.books;

-- 5. Check if RLS is enabled on books
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'books';
