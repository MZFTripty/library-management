'use client'

import React, { useEffect, useState } from 'react'
import { BookOpen, Calendar, Clock, CheckCircle, XCircle, Filter } from 'lucide-react'
import { Card, CardContent, Badge, Table, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { BorrowRecord, Book, BorrowStatus } from '@/lib/database.types'
import { format } from 'date-fns'

interface BorrowWithBook extends BorrowRecord {
    books: Book
}

export default function HistoryPage() {
    const [borrows, setBorrows] = useState<BorrowWithBook[]>([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState<string>('')

    useEffect(() => {
        const fetchHistory = async () => {
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
                    .order('borrowed_at', { ascending: false })

                if (data) setBorrows(data as BorrowWithBook[])
            }
            setLoading(false)
        }

        fetchHistory()
    }, [])

    const filteredBorrows = statusFilter
        ? borrows.filter((b) => b.status === statusFilter)
        : borrows

    const getStatusBadge = (status: BorrowStatus) => {
        switch (status) {
            case 'returned':
                return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Returned</Badge>
            case 'borrowed':
                return <Badge variant="primary"><Clock className="w-3 h-3 mr-1" />Borrowed</Badge>
            case 'overdue':
                return <Badge variant="error"><XCircle className="w-3 h-3 mr-1" />Overdue</Badge>
        }
    }

    const columns = [
        {
            key: 'books' as const,
            header: 'Book',
            render: (borrow: BorrowWithBook) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-14 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                        {borrow.books.cover_image ? (
                            <img
                                src={borrow.books.cover_image}
                                alt={borrow.books.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <BookOpen className="w-5 h-5 text-slate-400" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{borrow.books.name}</p>
                        <p className="text-sm text-slate-500">{borrow.books.author}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'borrowed_at' as const,
            header: 'Borrowed Date',
            render: (borrow: BorrowWithBook) => (
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {format(new Date(borrow.borrowed_at), 'MMM d, yyyy')}
                </span>
            ),
        },
        {
            key: 'due_date' as const,
            header: 'Due Date',
            render: (borrow: BorrowWithBook) => (
                <span className="text-slate-600 dark:text-slate-300">
                    {format(new Date(borrow.due_date), 'MMM d, yyyy')}
                </span>
            ),
        },
        {
            key: 'returned_at' as const,
            header: 'Returned Date',
            render: (borrow: BorrowWithBook) => (
                <span className="text-slate-600 dark:text-slate-300">
                    {borrow.returned_at
                        ? format(new Date(borrow.returned_at), 'MMM d, yyyy')
                        : '-'}
                </span>
            ),
        },
        {
            key: 'status' as const,
            header: 'Status',
            render: (borrow: BorrowWithBook) => getStatusBadge(borrow.status),
        },
    ]

    // Calculate stats
    const totalBorrows = borrows.length
    const returnedCount = borrows.filter((b) => b.status === 'returned').length
    const overdueCount = borrows.filter((b) => b.status === 'overdue').length

    return (
        <div className="space-y-6 animate-slideUp">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Borrowing History
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    View your complete borrowing history
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-slate-500">Total Borrows</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {totalBorrows}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-slate-500">Currently Borrowed</p>
                        <p className="text-2xl font-bold text-indigo-600">
                            {borrows.filter((b) => b.status === 'borrowed').length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-slate-500">Returned</p>
                        <p className="text-2xl font-bold text-green-600">{returnedCount}</p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-slate-500">Overdue</p>
                        <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <Card padding="sm">
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <Select
                            placeholder="All Status"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'borrowed', label: 'Borrowed' },
                                { value: 'returned', label: 'Returned' },
                                { value: 'overdue', label: 'Overdue' },
                            ]}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Table
                data={filteredBorrows}
                columns={columns}
                rowKey="id"
                loading={loading}
                emptyMessage="No borrowing history found."
            />
        </div>
    )
}
