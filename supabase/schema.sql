-- Library Management System Database Schema
-- Run this in your Supabase SQL Editor to initialize or reset the schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENUM TYPES
-- ============================================
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'member', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.borrow_status AS ENUM ('pending', 'borrowed', 'returned', 'overdue', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. TABLES DEFINITIONS
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    role public.user_role DEFAULT 'member'::public.user_role,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Book shelves
CREATE TABLE IF NOT EXISTS public.book_shelves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    capacity INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Books
CREATE TABLE IF NOT EXISTS public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid TEXT UNIQUE NOT NULL, -- Custom book identifier
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    categories TEXT[] DEFAULT '{}',
    shelf_id UUID REFERENCES public.book_shelves(id) ON DELETE SET NULL,
    total_copies INTEGER DEFAULT 1,
    available_copies INTEGER DEFAULT 1,
    cover_image TEXT,
    isbn TEXT,
    publisher TEXT,
    published_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Borrow records
CREATE TABLE IF NOT EXISTS public.borrow_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    borrowed_at TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    returned_at TIMESTAMPTZ,
    status public.borrow_status DEFAULT 'pending'::public.borrow_status,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fines
CREATE TABLE IF NOT EXISTS public.fines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrow_record_id UUID REFERENCES public.borrow_records(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'unpaid', -- 'unpaid', 'reported', 'paid'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Settings
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to handle new user creation from Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, phone, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      'New User'
    ),
    COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'member'::public.user_role),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Robust fallback that still tries to save basic info
  INSERT INTO public.users (id, email, name, role, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'New User'),
    'member',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- --- USERS ---
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users FOR UPDATE USING (public.is_admin());

-- --- BOOK SHELVES ---
DROP POLICY IF EXISTS "Anyone can view book shelves" ON public.book_shelves;
CREATE POLICY "Anyone can view book shelves" ON public.book_shelves FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage book shelves" ON public.book_shelves;
CREATE POLICY "Admins can manage book shelves" ON public.book_shelves FOR ALL USING (public.is_admin());

-- --- BOOKS ---
DROP POLICY IF EXISTS "Anyone can view books" ON public.books;
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
CREATE POLICY "Admins can manage books" ON public.books FOR ALL USING (public.is_admin());

-- --- BORROW RECORDS ---
DROP POLICY IF EXISTS "Members can view their own borrow records" ON public.borrow_records;
CREATE POLICY "Members can view their own borrow records" ON public.borrow_records FOR SELECT USING (member_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all borrow records" ON public.borrow_records;
CREATE POLICY "Admins can view all borrow records" ON public.borrow_records FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Members can insert borrow records" ON public.borrow_records;
CREATE POLICY "Members can insert borrow records" ON public.borrow_records FOR INSERT WITH CHECK (member_id = auth.uid());

DROP POLICY IF EXISTS "Members can cancel their own pending requests" ON public.borrow_records;
CREATE POLICY "Members can cancel their own pending requests" ON public.borrow_records FOR DELETE USING (member_id = auth.uid() AND status = 'pending');

DROP POLICY IF EXISTS "Admins can manage borrow records" ON public.borrow_records;
CREATE POLICY "Admins can manage borrow records" ON public.borrow_records FOR ALL USING (public.is_admin());

-- --- FINES ---
DROP POLICY IF EXISTS "Members can view their own fines" ON public.fines;
CREATE POLICY "Members can view their own fines" ON public.fines FOR SELECT USING (member_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage fines" ON public.fines;
CREATE POLICY "Admins can manage fines" ON public.fines FOR ALL USING (public.is_admin());

-- --- SYSTEM SETTINGS ---
DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
CREATE POLICY "Anyone can read system settings" ON public.system_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;
CREATE POLICY "Admins can manage system settings" ON public.system_settings FOR ALL USING (public.is_admin());
