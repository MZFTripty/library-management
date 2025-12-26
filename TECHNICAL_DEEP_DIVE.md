# 🛠️ Technical Deep Dive: LibraryMS Core Systems

This document provides a detailed technical explanation of the architecture and logic implemented in the Library Management System.

---

## 🔒 1. Social Login & Profile Sync
**Problem**: Users logging in with Google were appearing as "New User (Recovery)" because the system wasn't correctly mapping Google's metadata to the profile table.

**Solution**: I implemented a robust Postgres trigger function.
- **Logic**: When a user signs up via OAuth, Supabase stores their profile info in `raw_user_meta_data`. 
- **Mapping**: The trigger uses `COALESCE` to look for names in this order: `full_name` (Google) -> `name` (Standard) -> "New User" (Fallback).
- **Security**: The function uses `SECURITY DEFINER` to ensure it has the permissions to write to the `public.users` table even before the user's Row Level Security (RLS) is fully active.

---

## 🛡️ 2. Global Auth Middleware
**Architecture**: Next.js Middleware acts as a gatekeeper for every single request.

**Strategy**: I shifted from a "protected-only" list to a **Public Route Blacklist**.
- **Public Routes**: `/`, `/login`, `/register`, `/auth/callback`.
- **Logic Flow**:
  1. Intercept request.
  2. Call `supabase.auth.getUser()` (most secure way to verify session).
  3. If **Not Authenticated** & **Path is Private** -> Redirect to `/login`.
  4. If **Authenticated** & **Path is Auth-related** (like `/login`) -> Redirect to `/dashboard`.

---

## 🖼️ 3. Dynamic Avatar System
**Pattern**: Used a consistent "Priority Rendering" pattern across all components.

**Implementation**:
1. Check if `user.avatar_url` exists.
2. If yes: Render an `<img />` with `object-cover`.
3. If no: Render a styled `<span>` containing the first letter of the user's name (initial).
4. **Fallback Logic**: `{user.name?.[0]?.toUpperCase() || 'U'}` ensures it never crashes even with malformed data.

---

## 🔍 4. Global Search (Debounced & Efficient)
**Component**: `GlobalSearch.tsx`

**Optimization**:
- **Debouncing**: Uses a 300ms `setTimeout` to batch database queries.
- **Context-Aware**: Searches `books` globally, but restricts `members` search to Admins only.
- **Intrusive UX**: Detects clicks outside the search results to auto-dismiss the dropdown.

---

## 🏗️ 5. SQL Schema Consolidation
**Design**: Centralized `schema.sql`.

**Key Improvements**:
- **Enums**: `user_role` and `borrow_status` for strict type safety.
- **RLS**: Row-level security on every table ensures users only see what they're allowed to (e.g., their own borrow history).
- **Triggers**: Automated sync from Supabase Auth to Public Profiles.

---

**Summary**: These implementations ensure the system is not just functional, but **secure, scalable, and professional**.
