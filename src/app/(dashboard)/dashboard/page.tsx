'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, TrendingUp, AlertTriangle, Plus, Library, Clock, Star, Zap, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import { isPast, parseISO } from 'date-fns'

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

                const [booksCount, membersCount, activeLoanRecords] = await Promise.all([
                    supabase.from('books').select('*', { count: 'exact', head: true }),
                    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'member'),
                    supabase.from('borrow_records')
                        .select('status, due_date')
                        .in('status', ['borrowed', 'overdue'])
                ])

                const loans = (activeLoanRecords.data || []) as any[]
                const overdueCount = loans.filter(r =>
                    r.status === 'overdue' || (r.status === 'borrowed' && isPast(parseISO(r.due_date)))
                ).length

                setStats({
                    totalBooks: booksCount.count || 0,
                    totalMembers: membersCount.count || 0,
                    activeBorrows: loans.length,
                    overdueBooks: overdueCount,
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
                <div className="h-48 bg-gray-200 dark:bg-white/5 rounded-2xl" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 dark:bg-white/5 rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header with Search (Tablet/Mobile Only) */}
            <div className="lg:hidden">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">Dashboard</h1>
                <p className="text-muted-foreground text-sm font-medium mt-1">LMS Premium Experience</p>
            </div>

            {/* Welcome Banner */}
            <div className="relative group overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-transparent dark:to-transparent">
                {/* Dark Mode Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-purple-700 to-primary opacity-0 dark:opacity-90 group-hover:scale-105 transition-all duration-700" />
                <div className="hidden dark:block absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="hidden dark:block absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse duration-7s" />

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 text-yellow-300" />
                            Premium Membership
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-medium">{greeting()},</p>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                                {user?.name?.split(' ')[0] || 'Member'}! 👋
                            </h1>
                        </div>
                        <p className="text-indigo-50 text-sm leading-relaxed max-w-md">
                            {user?.role === 'admin'
                                ? 'Transform your library collection into an organized digital paradise.'
                                : 'Your next literary adventure is just a click away. What will you read today?'}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <Link href="/catalog">
                                <Button className="bg-white text-primary hover:bg-white/90 shadow-lg shadow-white/20 font-bold px-6">
                                    Browse Catalog
                                </Button>
                            </Link>
                            {user?.role === 'admin' && (
                                <Link href="/admin/books/new">
                                    <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-md font-bold px-6">
                                        <Plus className="w-4 h-4 mr-2" /> Add New Book
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hidden dark:md:flex justify-end pr-8">
                        <div className="w-48 h-48 relative animate-float">
                            <div className="absolute inset-0 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 rotate-12" />
                            <div className="absolute inset-0 bg-primary/20 rounded-3xl backdrop-blur-md border border-white/20 -rotate-6" />
                            <div className="absolute inset-0 bg-white/5 rounded-3xl backdrop-blur-md border border-white/20 flex items-center justify-center">
                                <BookOpen className="w-20 h-20 text-white drop-shadow-2xl" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Collection', value: isDemoMode ? 156 : stats.totalBooks, icon: BookOpen, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
                    { label: 'Active Members', value: isDemoMode ? 42 : stats.totalMembers, icon: Users, color: 'text-green-500', bgColor: 'bg-green-500/10' },
                    { label: 'Active Loans', value: isDemoMode ? 23 : stats.activeBorrows, icon: TrendingUp, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
                    { label: 'Overdue Alerts', value: isDemoMode ? 3 : stats.overdueBooks, icon: AlertTriangle, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
                ].map((stat) => (
                    <Card key={stat.label} hover className="border-none shadow-primary/5">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 ${stat.bgColor} rounded-2xl flex items-center justify-center`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className="h-8 w-8 rounded-full bg-white/5 dark:bg-black/20 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-foreground tracking-tight">{stat.value}</h3>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Quick Actions */}
                <Card className="lg:col-span-8 border-none" padding="lg">
                    <div className="flex items-center justify-between mb-8">
                        <div className="space-y-1">
                            <h2 className="text-xl font-black flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-amber-500/20">
                                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                </div>
                                Quick Actions
                            </h2>
                            <p className="text-xs text-muted-foreground font-medium">Frequently used management tools</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {user?.role === 'admin' ? (
                            <>
                                <Link href="/admin/assign">
                                    <div className="group space-y-3 p-4 rounded-2xl bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <BookOpen className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight text-foreground">Assign Book</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Quick issue system</p>
                                        </div>
                                    </div>
                                </Link>
                                <Link href="/admin/books">
                                    <div className="group space-y-3 p-4 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Library className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight text-foreground">Inventory</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Manage collection</p>
                                        </div>
                                    </div>
                                </Link>
                                <Link href="/admin/members">
                                    <div className="group space-y-3 p-4 rounded-2xl bg-white/5 hover:bg-blue-500/10 border border-white/5 hover:border-blue-500/20 transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Users className="w-6 h-6 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight text-foreground">Users</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Member directory</p>
                                        </div>
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link href="/catalog">
                                    <div className="group space-y-3 p-4 rounded-2xl bg-white/5 hover:bg-primary/10 border border-white/5 hover:border-primary/20 transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <BookOpen className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight text-foreground">Explore</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Browse new books</p>
                                        </div>
                                    </div>
                                </Link>
                                <Link href="/member/my-books">
                                    <div className="group space-y-3 p-4 rounded-2xl bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/20 transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Library className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight text-foreground">My Library</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Currently reading</p>
                                        </div>
                                    </div>
                                </Link>
                                <Link href="/member/history">
                                    <div className="group space-y-3 p-4 rounded-2xl bg-white/5 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/20 transition-all cursor-pointer">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Clock className="w-6 h-6 text-purple-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm tracking-tight text-foreground">Reading Log</p>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Borrowing history</p>
                                        </div>
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>
                </Card>

                {/* Info / Tips */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none" padding="md">
                        <CardTitle className="mb-4 flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-yellow-500/20">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            </div>
                            Smart Tips
                        </CardTitle>
                        <div className="space-y-4">
                            {[
                                { title: 'AI Recommendation', text: 'Chat with our AI bot for personalized book picks.', color: 'indigo' },
                                { title: 'Quick Search', text: 'Use the global search for titles, authors or categories.', color: 'emerald' },
                                { title: 'Due Dates', text: 'Keep track of your due dates to avoid fine accumulation.', color: 'rose' }
                            ].map((tip) => (
                                <div key={tip.title} className="group relative p-3 rounded-xl border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">
                                    <p className="text-sm font-bold text-foreground">{tip.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.text}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
