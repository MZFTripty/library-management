'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, TrendingUp, AlertTriangle, Plus, Library, Clock, Star, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/lib/database.types'

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalMembers: 0,
        activeBorrows: 0,
        overdueBooks: 0,
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single()
                setUser(userData)

                const [booksCount, membersCount, borrowsCount, overdueCount] = await Promise.all([
                    supabase.from('books').select('*', { count: 'exact', head: true }),
                    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member'),
                    supabase.from('borrow_records').select('*', { count: 'exact', head: true }).eq('status', 'borrowed'),
                    supabase.from('borrow_records').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
                ])

                setStats({
                    totalBooks: booksCount.count || 0,
                    totalMembers: membersCount.count || 0,
                    activeBorrows: borrowsCount.count || 0,
                    overdueBooks: overdueCount.count || 0,
                })
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    const greeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
    }

    const isDemoMode = stats.totalBooks === 0

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-36 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                    <p className="text-indigo-200 text-sm">Welcome back</p>
                    <h1 className="text-2xl font-bold mt-1">{greeting()}, {user?.name?.split(' ')[0] || 'there'}! 👋</h1>
                    <p className="text-indigo-100 mt-2 text-sm max-w-md">
                        {user?.role === 'admin'
                            ? 'Manage your library collection and help readers discover great books.'
                            : 'Discover your next favorite book from our collection.'}
                    </p>
                    <div className="flex gap-3 mt-5">
                        <Link href="/catalog">
                            <button className="px-4 py-2 bg-white text-indigo-600 text-sm font-semibold rounded-lg hover:bg-indigo-50 transition-colors">
                                Browse Catalog
                            </button>
                        </Link>
                        {user?.role === 'admin' && (
                            <Link href="/admin/books/new">
                                <button className="px-4 py-2 bg-white/20 text-white text-sm font-semibold rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add Book
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Demo Notice */}
            {isDemoMode && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Library className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">Setup Required</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">Run the database schema in Supabase SQL Editor.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Books', value: isDemoMode ? 156 : stats.totalBooks, icon: BookOpen, color: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Members', value: isDemoMode ? 42 : stats.totalMembers, icon: Users, color: 'bg-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'Active Borrows', value: isDemoMode ? 23 : stats.activeBorrows, icon: TrendingUp, color: 'bg-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
                    { label: 'Overdue', value: isDemoMode ? 3 : stats.overdueBooks, icon: AlertTriangle, color: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                            <stat.icon className="w-5 h-5 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Quick Actions & Tips */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" />
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {user?.role === 'admin' ? (
                            <>
                                <Link href="/admin/assign">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer">
                                        <BookOpen className="w-6 h-6 text-indigo-600 mb-2" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Assign Book</p>
                                        <p className="text-xs text-gray-500">Issue to member</p>
                                    </div>
                                </Link>
                                <Link href="/admin/books">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 border border-transparent hover:border-green-200 dark:hover:border-green-800 transition-all cursor-pointer">
                                        <Library className="w-6 h-6 text-green-600 mb-2" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Manage Books</p>
                                        <p className="text-xs text-gray-500">View collection</p>
                                    </div>
                                </Link>
                                <Link href="/admin/members">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-transparent hover:border-purple-200 dark:hover:border-purple-800 transition-all cursor-pointer">
                                        <Users className="w-6 h-6 text-purple-600 mb-2" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Members</p>
                                        <p className="text-xs text-gray-500">Manage users</p>
                                    </div>
                                </Link>
                                <Link href="/reports">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-transparent hover:border-amber-200 dark:hover:border-amber-800 transition-all cursor-pointer">
                                        <TrendingUp className="w-6 h-6 text-amber-600 mb-2" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Reports</p>
                                        <p className="text-xs text-gray-500">Analytics</p>
                                    </div>
                                </Link>
                                <Link href="/fines">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800 transition-all cursor-pointer">
                                        <AlertTriangle className="w-6 h-6 text-red-600 mb-2" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Fines</p>
                                        <p className="text-xs text-gray-500">Manage overdue</p>
                                    </div>
                                </Link>
                                <Link href="/admin/shelves">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-900/20 border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800 transition-all cursor-pointer">
                                        <Library className="w-6 h-6 text-cyan-600 mb-2" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Shelves</p>
                                        <p className="text-xs text-gray-500">Organize books</p>
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/catalog">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-transparent hover:border-indigo-200 transition-all cursor-pointer">
                                        <BookOpen className="w-6 h-6 text-indigo-600 mb-2" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">Browse Books</p>
                                        <p className="text-xs text-gray-500">Find your next read</p>
                                    </div>
                                </Link>
                                <Link href="/member/my-books">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 border border-transparent hover:border-green-200 transition-all cursor-pointer">
                                        <Library className="w-6 h-6 text-green-600 mb-2" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">My Books</p>
                                        <p className="text-xs text-gray-500">Currently borrowed</p>
                                    </div>
                                </Link>
                                <Link href="/member/history">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-transparent hover:border-purple-200 transition-all cursor-pointer">
                                        <Clock className="w-6 h-6 text-purple-600 mb-2" />
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">History</p>
                                        <p className="text-xs text-gray-500">Past borrows</p>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" />
                        Tips
                    </h2>
                    <div className="space-y-3">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">AI Recommendations</p>
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">Try the chatbot for personalized suggestions!</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                            <p className="text-sm font-medium text-green-900 dark:text-green-200">Quick Search</p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Search by title, author, or category.</p>
                        </div>
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg">
                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Due Dates</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Check due dates to avoid fines!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
