'use client'

import React, { useEffect, useState } from 'react'
import { BookOpen, Calendar, Clock, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { BorrowRecord, Book } from '@/lib/database.types'
import { format, differenceInDays, isPast } from 'date-fns'

interface BorrowWithBook extends BorrowRecord {
    books: Book
}

export default function MyBooksPage() {
    const [borrows, setBorrows] = useState<BorrowWithBook[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBorrows = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data } = await supabase
                    .from('borrow_records')
                    .select(`
            *,
            books (*)
          `)
                    .eq('member_id', user.id)
                    .eq('status', 'borrowed')
                    .order('due_date')

                if (data) setBorrows(data as BorrowWithBook[])
            }
            setLoading(false)
        }

        fetchBorrows()
    }, [])

    const getStatusBadge = (dueDate: string) => {
        const due = new Date(dueDate)
        const daysLeft = differenceInDays(due, new Date())

        if (isPast(due)) {
            return <Badge variant="error" dot>Overdue</Badge>
        } else if (daysLeft <= 3) {
            return <Badge variant="warning" dot>Due Soon</Badge>
        } else {
            return <Badge variant="success" dot>On Time</Badge>
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-slideUp">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    My Borrowed Books
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    View and track your currently borrowed books
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                <BookOpen className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Borrowed</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    {borrows.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Due Soon</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    {borrows.filter((b) => {
                                        const days = differenceInDays(new Date(b.due_date), new Date())
                                        return days >= 0 && days <= 3
                                    }).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Overdue</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {borrows.filter((b) => isPast(new Date(b.due_date))).length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Books List */}
            {borrows.length === 0 ? (
                <Card>
                    <CardContent>
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                No borrowed books
                            </h3>
                            <p className="text-gray-500 mt-1">
                                You don&apos;t have any books borrowed at the moment.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {borrows.map((borrow) => {
                        const daysLeft = differenceInDays(new Date(borrow.due_date), new Date())
                        const isOverdue = daysLeft < 0

                        return (
                            <Card key={borrow.id} hover>
                                <CardContent>
                                    <div className="flex gap-4">
                                        {/* Book Cover */}
                                        <div className="w-20 h-28 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {borrow.books.cover_image ? (
                                                <img
                                                    src={borrow.books.cover_image}
                                                    alt={borrow.books.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <BookOpen className="w-8 h-8 text-gray-400" />
                                            )}
                                        </div>

                                        {/* Book Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                    {borrow.books.name}
                                                </h3>
                                                {getStatusBadge(borrow.due_date)}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">{borrow.books.author}</p>

                                            <div className="mt-4 space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600 dark:text-gray-300">
                                                        Borrowed: {format(new Date(borrow.borrowed_at), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Clock className="w-4 h-4 text-gray-400" />
                                                    <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600 dark:text-gray-300'}>
                                                        Due: {format(new Date(borrow.due_date), 'MMM d, yyyy')}
                                                        {isOverdue
                                                            ? ` (${Math.abs(daysLeft)} days overdue)`
                                                            : daysLeft <= 3
                                                                ? ` (${daysLeft} days left)`
                                                                : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
