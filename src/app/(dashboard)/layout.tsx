'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Menu,
    LogOut,
    Bell,
    Search,
} from 'lucide-react'
import { User } from '@/lib/database.types'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()

                if (data) {
                    setUser(data)
                }
            }
            setLoading(false)
        }

        fetchUser()
    }, [])

    const handleSignOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent transition-colors duration-300">
            {/* 1. Desktop Sidebar (Fixed) */}
            <div className="hidden lg:block">
                <Sidebar
                    user={user}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    variant="sidebar"
                />
            </div>

            {/* 2. Mobile Sidebar (Drawer) */}
            <div className="lg:hidden">
                <Sidebar
                    user={user}
                    variant="drawer"
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                />
            </div>

            {/* Main Content Area */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>

                {/* Header */}
                <header className="sticky top-0 z-20 h-20 bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="h-full px-4 lg:px-8 flex items-center justify-between gap-4">

                        {/* Mobile Menu Trigger */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2.5 -ml-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-xl mx-auto hidden sm:block">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search books, authors, categories..."
                                    className="w-full pl-12 pr-4 py-3 bg-gray-100/50 dark:bg-gray-700/30 border border-transparent focus:border-indigo-500/30 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
                                />
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-3 sm:gap-4">
                            <button className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700/50 rounded-xl relative transition-all duration-200">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800" />
                            </button>

                            {/* User Menu (Mobile/Tablet only - Desktop has sidebar profile) */}
                            <div className="hidden sm:flex lg:hidden items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                                {user && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8 animate-fadeIn">
                    <div className="max-w-7xl mx-auto min-h-[calc(100vh-8rem)]">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
