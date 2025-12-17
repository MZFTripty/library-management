# RLS Fix - Complete Guide

## The Problem
You're getting "new row violates row-level security policy for table 'books'" because:
1. The RLS policies in Supabase require admin role
2. The policies need to be updated in your Supabase database (not just in code)

## Solution Options

### Option 1: Run SQL in Supabase (RECOMMENDED - 30 seconds)
1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste this ENTIRE script:

```sql
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

-- Verify you're an admin
SELECT id, email, name, role FROM public.users WHERE id = auth.uid();
```

3. Click "Run"
4. Check the last query result - if it shows `role: 'admin'`, you're done!
5. If it shows `role: 'member'`, run this too:
```sql
UPDATE public.users SET role = 'admin' WHERE id = auth.uid();
```

### Option 2: Use Service Role Key (if you can't access Supabase SQL Editor)
1. Go to Supabase Dashboard → Settings → API
2. Copy your "service_role" key (NOT the anon key)
3. Add to `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
4. Restart your dev server (`npm run dev`)
5. The API route I created will now work

### Option 3: Temporarily Disable RLS (TESTING ONLY)
Run in Supabase SQL Editor:
```sql
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;
```
This lets you add books immediately but is NOT secure for production.

## Why This Happened
- RLS policies are stored IN the database, not in your code
- The `schema.sql` file is just a template
- You must manually execute SQL changes in Supabase

## After Fix
Once fixed, you can add books normally through the UI!
