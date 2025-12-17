-- Library Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');
CREATE TYPE borrow_status AS ENUM ('borrowed', 'returned', 'overdue');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role DEFAULT 'member' NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Book shelves table
CREATE TABLE public.book_shelves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    capacity INTEGER DEFAULT 100 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Books table
CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uid TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    author TEXT NOT NULL,
    description TEXT,
    categories TEXT[] DEFAULT '{}' NOT NULL,
    shelf_id UUID REFERENCES public.book_shelves(id) ON DELETE SET NULL,
    total_copies INTEGER DEFAULT 1 NOT NULL,
    available_copies INTEGER DEFAULT 1 NOT NULL,
    cover_image TEXT,
    isbn TEXT,
    publisher TEXT,
    published_year INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT available_copies_check CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

-- Borrow records table
CREATE TABLE public.borrow_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    borrowed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    returned_at TIMESTAMPTZ,
    status borrow_status DEFAULT 'borrowed' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Fines table
CREATE TABLE public.fines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    borrow_record_id UUID NOT NULL REFERENCES public.borrow_records(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    paid BOOLEAN DEFAULT FALSE NOT NULL,
    paid_at TIMESTAMPTZ,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_books_shelf_id ON public.books(shelf_id);
CREATE INDEX idx_books_author ON public.books(author);
CREATE INDEX idx_books_categories ON public.books USING GIN(categories);
CREATE INDEX idx_borrow_records_book_id ON public.borrow_records(book_id);
CREATE INDEX idx_borrow_records_member_id ON public.borrow_records(member_id);
CREATE INDEX idx_borrow_records_status ON public.borrow_records(status);
CREATE INDEX idx_fines_member_id ON public.fines(member_id);
CREATE INDEX idx_fines_paid ON public.fines(paid);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_book_shelves_updated_at
    BEFORE UPDATE ON public.book_shelves
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON public.books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_borrow_records_updated_at
    BEFORE UPDATE ON public.borrow_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fines_updated_at
    BEFORE UPDATE ON public.fines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin status (bypassing RLS)
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

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Admins can update any user"
    ON public.users FOR UPDATE
    USING (public.is_admin());

-- Book shelves policies (viewable by everyone)
CREATE POLICY "Anyone can view book shelves"
    ON public.book_shelves FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Only admins can manage book shelves"
    ON public.book_shelves FOR ALL
    USING (public.is_admin());

-- Books policies (viewable by everyone)
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

-- Borrow records policies
CREATE POLICY "Members can view their own borrow records"
    ON public.borrow_records FOR SELECT
    USING (member_id = auth.uid());

CREATE POLICY "Admins can view all borrow records"
    ON public.borrow_records FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Only admins can manage borrow records"
    ON public.borrow_records FOR ALL
    USING (public.is_admin());

-- Fines policies
CREATE POLICY "Members can view their own fines"
    ON public.fines FOR SELECT
    USING (member_id = auth.uid());

CREATE POLICY "Admins can view all fines"
    ON public.fines FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Only admins can manage fines"
    ON public.fines FOR ALL
    USING (public.is_admin());

-- Insert some sample data
INSERT INTO public.book_shelves (name, location, description, capacity) VALUES
    ('Fiction Section A', 'First Floor, Row 1', 'Classic and contemporary fiction', 150),
    ('Fiction Section B', 'First Floor, Row 2', 'Best sellers and new releases', 150),
    ('Non-Fiction', 'Second Floor, Row 1', 'History, science, and biography', 200),
    ('Reference', 'Ground Floor', 'Encyclopedias and dictionaries', 100),
    ('Children''s Books', 'First Floor, Kids Corner', 'Books for children of all ages', 120);
