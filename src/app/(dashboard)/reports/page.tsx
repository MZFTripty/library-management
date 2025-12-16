'use client'

import React, { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, BookOpen, Download, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Button, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'

interface ReportStats {
    totalBorrows: number
    totalReturns: number
    totalOverdue: number
    totalMembers: number
    totalBooks: number
    popularBooks: { name: string; count: number }[]
    activeMembers: { name: string; count: number }[]
}

export default function ReportsPage() {
    const [stats, setStats] = useState<ReportStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true)
            const supabase = createClient()

            // Get date range based on period
            const now = new Date()
            let startDate = new Date()
            if (period === 'day') {
                startDate.setDate(now.getDate() - 1)
            } else if (period === 'month') {
                startDate.setMonth(now.getMonth() - 1)
            } else if (period === 'year') {
                startDate.setFullYear(now.getFullYear() - 1)
            }

            const [borrowsResult, returnsResult, overdueResult, membersResult, booksResult] =
                await Promise.all([
                    (supabase
                        .from('borrow_records') as any)
                        .select('*', { count: 'exact', head: true })
                        .gte('borrowed_at', startDate.toISOString()),
                    (supabase
                        .from('borrow_records') as any)
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'returned')
                        .gte('returned_at', startDate.toISOString()),
                    (supabase
                        .from('borrow_records') as any)
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'overdue'),
                    (supabase.from('users') as any).select('*', { count: 'exact', head: true }).eq('role', 'member'),
                    (supabase.from('books') as any).select('*', { count: 'exact', head: true }),
                ])

            // Get popular books
            const { data: popularData } = await (supabase
                .from('borrow_records') as any)
                .select('book_id, books(name)')
                .gte('borrowed_at', startDate.toISOString())

            const bookCounts: Record<string, { name: string; count: number }> = {}
            popularData?.forEach((record: { book_id: string; books: { name: string } | null }) => {
                const id = record.book_id
                if (!bookCounts[id]) {
                    bookCounts[id] = { name: record.books?.name || 'Unknown', count: 0 }
                }
                bookCounts[id].count++
            })
            const popularBooks = Object.values(bookCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)

            // Get active members
            const { data: activeData } = await (supabase
                .from('borrow_records') as any)
                .select('member_id, users(name)')
                .gte('borrowed_at', startDate.toISOString())

            const memberCounts: Record<string, { name: string; count: number }> = {}
            activeData?.forEach((record: { member_id: string; users: { name: string } | null }) => {
                const id = record.member_id
                if (!memberCounts[id]) {
                    memberCounts[id] = { name: record.users?.name || 'Unknown', count: 0 }
                }
                memberCounts[id].count++
            })
            const activeMembers = Object.values(memberCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)

            setStats({
                totalBorrows: borrowsResult.count || 0,
                totalReturns: returnsResult.count || 0,
                totalOverdue: overdueResult.count || 0,
                totalMembers: membersResult.count || 0,
                totalBooks: booksResult.count || 0,
                popularBooks,
                activeMembers,
            })
            setLoading(false)
        }

        fetchStats()
    }, [period])

    if (loading || !stats) {
        return (
            <div className="space-y-6">
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-slideUp">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Library usage statistics and insights
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        value={period}
                        onChange={setPeriod}
                        options={[
                            { value: 'day', label: 'Last 24 Hours' },
                            { value: 'month', label: 'Last Month' },
                            { value: 'year', label: 'Last Year' },
                        ]}
                    />
                    <Link href="/reports/export">
                        <Button variant="outline" icon={<Download className="w-4 h-4" />}>
                            Export
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Borrows</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {stats.totalBorrows}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Returns</p>
                                <p className="text-xl font-bold text-green-600">{stats.totalReturns}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                <Users className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Members</p>
                                <p className="text-xl font-bold text-amber-600">{stats.totalMembers}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                                <BookOpen className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Overdue</p>
                                <p className="text-xl font-bold text-red-600">{stats.totalOverdue}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Books */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            Most Borrowed Books
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.popularBooks.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No data available</p>
                        ) : (
                            <div className="space-y-4">
                                {stats.popularBooks.map((book, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-medium text-indigo-600">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {book.name}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-500">
                                            {book.count} borrows
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Active Members */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Most Active Members
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.activeMembers.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No data available</p>
                        ) : (
                            <div className="space-y-4">
                                {stats.activeMembers.map((member, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <span className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-medium text-green-600">
                                            {index + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {member.name}
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium text-gray-500">
                                            {member.count} books
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
