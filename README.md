# 📚 LibraryMS: Modern Library Management System

Welcome to **LibraryMS**, a state-of-the-art digital library management platform designed for seamless knowledge management. Built with a focus on aesthetics, security, and performance.

![LibraryMS Preview](https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=2428)

> [!IMPORTANT]
> **Technical Reference**: For a detailed explanation of the core systems (Auth, Search, SQL Architecture), please refer to the [TECHNICAL_DEEP_DIVE.md](file:///d:/Softsasi/library/management/library-management/TECHNICAL_DEEP_DIVE.md).

## ✨ Features

### 🔐 Advanced Authentication
- **Social Login**: One-click registration/login with Google.
- **Dynamic Profiles**: Automatic syncing of user names and avatars from social providers.
- **Strict Protection**: Comprehensive route protection ensuring only authorized users access the dashboard.

### 🏛️ Powerful Management (Admin Only)
- **Book Inventory**: Add, edit, and categorize books with ease.
- **Member Oversight**: Manage user roles and view member activity.
- **Smart Requests**: Approve or reject book borrow requests with a single click.
- **Reports & Exports**: Generate detailed reports and export them to professional Excel files.

### 📖 Enhanced User Experience (Members)
- **Digital Catalog**: Browse thousands of books with rich previews.
- **Personal Dashboard**: Track your current borrows, history, and due dates.
- **Global Search**: Find anything—books, authors, or categories—instantly across the entire platform.
- **Responsive Design**: A premium, "glassmorphic" UI that looks stunning on mobile, tablet, and desktop.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: custom-built with [Shadcn UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Exports**: [ExcelJS](https://github.com/exceljs/exceljs)

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone <repository-url>
cd library-management
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Initialization
1.  Go to your **Supabase SQL Editor**.
2.  Copy and run the content of `supabase/schema.sql` to set up tables, types, and security.
3.  (Optional) Run `supabase/seed.sql` to populate default shelves and settings.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see your library in action!

## 📂 Project Structure

- `src/app`: Next.js App Router (Routes & Layouts)
- `src/components`: Reusable UI and Layout components
- `src/lib`: Database client, utilities, and middleware
- `supabase/`: SQL schema and seed data definitions
- `public/`: Static assets and images

## 🗺️ App Architecture & Logic Map

This section details how the application is structured and the logic behind each major page.

### 🌐 Public Access
| Page | Function | Key Logic |
| :--- | :--- | :--- |
| **Home (`/`)** | Landing & Intro | Fetches real-time library stats (books, users, borrows) using Supabase head-only queries for efficiency. |
| **Login (`/login`)** | Auth Entry | `handleSocialLogin` triggers Supabase OAuth; `middleware.ts` redirects authenticated users to dashboard. |
| **Register (`/register`)** | New Users | Same as login; new user triggers `handle_new_user()` in Postgres to sync profile metadata. |

### 📊 Member Dashboard
| Page | Function | Key Logic |
| :--- | :--- | :--- |
| **Dashboard (`/dashboard`)** | Overview | Personalized greeting and stats; renders the global `Sidebar` and `GlobalSearch`. |
| **Catalog (`/catalog`)** | Book Discovery | Uses `ilike` filters in Supabase for searching titles and authors. |
| **My Books (`/member/my-books`)** | Borrow Tracking | Filters `borrow_records` where `member_id = auth.uid()`. |
| **Settings (`/settings`)** | Profile Mgmt | Allows updating local metadata and displays social avatar preview. |

### 🛠️ Admin Control Center
| Page | Function | Key Logic |
| :--- | :--- | :--- |
| **Members (`/admin/members`)** | User Management | Admin-only view to change roles (member/admin); verified by `is_admin()` SQL function. |
| **Books (`/admin/books`)** | Inventory | CRUD operations for library stock; updates `total_copies` and `available_copies`. |
| **Borrow Approval** | Request Hub | Admins approve `pending` requests, which decreases `available_copies` of a book. |
| **Reports (`/reports`)** | Data Export | Aggregates database views and uses `ExcelJS` to generate downloadable `.xlsx` files. |

## ⚙️ Core System Functions
- **`updateSession` (src/lib/supabase/middleware.ts)**: Validates session on every request; handles public/private route redirection.
- **`GlobalSearch` (src/components/layout/GlobalSearch.tsx)**: Debounced search component that queries `books` and `users` tables based on query strings.
- **`handle_new_user` (Postgres)**: Trigger that automatically populates the `public.users` table whenever a new user verifies their email or logs in via Google.

## 📜 License
© 2025 LibraryMS. All rights reserved. Built with ❤️ for readers everywhere.
