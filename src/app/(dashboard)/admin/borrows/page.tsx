'use client'

import React, { useEffect, useState } from 'react'
import {
    ClipboardList,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    User as UserIcon,
    BookOpen,
    Filter
} from 'lucide-react'
import { Button, Card, CardContent, Badge, Table, Modal, Input, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { BorrowRecord, Book, User } from '@/lib/database.types'
import { format, isPast, parseISO, differenceInDays } from 'date-fns'

interface BorrowRecordWithDetails extends BorrowRecord {
    books: Book
    users: User
}

export default function ManageLoansPage() {
    const [records, setRecords] = useState<BorrowRecordWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [returnModalOpen, setReturnModalOpen] = useState(false)
    const [recordToReturn, setRecordToReturn] = useState<BorrowRecordWithDetails | null>(null)
    const [returning, setReturning] = useState(false)

    const fetchRecords = async () => {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('borrow_records')
            .select(`
                *,
                books (*),
                users (*)
            `)
            .order('borrowed_at', { ascending: false })

        if (data) {
            setRecords(data as BorrowRecordWithDetails[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchRecords()
    }, [])

    const filteredRecords = records.filter((record) => {
        const matchesSearch =
            record.books.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.users.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.users.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && record.status === 'borrowed') ||
            (statusFilter === 'overdue' && record.status === 'overdue') ||
            record.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const handleReturnBook = async () => {
        if (!recordToReturn) return

        setReturning(true)
        const supabase = createClient()
        const now = new Date()

        // 1. Update borrow record
        const { error: updateError } = await (supabase.from('borrow_records') as any)
            .update({
                status: 'returned',
                returned_at: now.toISOString()
            })
            .eq('id', recordToReturn.id)

        if (!updateError) {
            // 2. Check for overdue fine
            const dueDate = parseISO(recordToReturn.due_date)
            if (now > dueDate) {
                const overdueDays = differenceInDays(now, dueDate)
                if (overdueDays > 0) {
                    const fineAmount = overdueDays * 10 // 10 Taka per day

                    await (supabase.from('fines') as any).insert({
                        borrow_record_id: recordToReturn.id,
                        member_id: recordToReturn.member_id,
                        amount: fineAmount,
                        paid: false,
                        description: `Overdue fine for ${overdueDays} days (৳10/day)`
                    })
                }
            }

            // 3. Increment book copies
            const { data: bookData } = await (supabase.from('books') as any)
                .select('available_copies')
                .eq('id', recordToReturn.book_id)
                .single()

            if (bookData) {
                await (supabase.from('books') as any)
                    .update({ available_copies: (bookData.available_copies || 0) + 1 })
                    .eq('id', recordToReturn.book_id)
            }

            // Refresh local state
            setRecords(records.map(r =>
                r.id === recordToReturn.id
                    ? { ...r, status: 'returned', returned_at: now.toISOString() }
                    : r
            ))
            setReturnModalOpen(false)
            setRecordToReturn(null)
        }
        setReturning(false)
    }

    const columns = [
        {
            key: 'book' as const,
            header: 'Book Info',
            render: (record: BorrowRecordWithDetails) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{record.books.name}</p>
                        <p className="text-xs text-gray-500">{record.books.uid}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'user' as const,
            header: 'Member',
            render: (record: BorrowRecordWithDetails) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-600">
                        <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{record.users.name}</p>
                        <p className="text-xs text-gray-500">{record.users.email}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'dates' as const,
            header: 'Timeline',
            render: (record: BorrowRecordWithDetails) => (
                <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-12 text-xs">Borrowed:</span>
                        {format(parseISO(record.borrowed_at), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 w-12 text-xs">Due:</span>
                        <span className={record.status !== 'returned' && isPast(parseISO(record.due_date)) ? 'text-red-500 font-medium' : ''}>
                            {format(parseISO(record.due_date), 'MMM d, yyyy')}
                        </span>
                    </div>
                    {record.returned_at && (
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 w-12 text-xs">Returned:</span>
                            <span className="text-green-600">{format(parseISO(record.returned_at), 'MMM d, yyyy')}</span>
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'status' as const,
            header: 'Status',
            render: (record: BorrowRecordWithDetails) => {
                let statusVariant: 'default' | 'success' | 'error' | 'warning' = 'default'
                let icon = Clock

                if (record.status === 'returned') {
                    statusVariant = 'success'
                    icon = CheckCircle
                } else if (record.status === 'overdue') {
                    statusVariant = 'error'
                    icon = XCircle
                } else if (isPast(parseISO(record.due_date))) {
                    // Client-side overdue check if DB job hasn't run
                    statusVariant = 'error'
                    icon = XCircle
                } else {
                    statusVariant = 'default'
                }

                return (
                    <Badge variant={statusVariant} className="capitalize gap-1">
                        {React.createElement(icon, { size: 12 })}
                        {record.status === 'borrowed' && isPast(parseISO(record.due_date)) ? 'Overdue' : record.status}
                    </Badge>
                )
            }
        },
        {
            key: 'actions' as const,
            header: 'Actions',
            render: (record: BorrowRecordWithDetails) => (
                record.status !== 'returned' && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setRecordToReturn(record)
                            setReturnModalOpen(true)
                        }}
                    >
                        Mark Returned
                    </Button>
                )
            )
        }
    ]

    return (
        <div className="space-y-6 animate-slideUp">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Manage Loans
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Track borrowed books and process returns
                </p>
            </div>

            {/* Filters */}
            <Card padding="sm">
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <Input
                                placeholder="Search by book, member name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'all', label: 'All Status' },
                                { value: 'active', label: 'Active Loans' },
                                { value: 'returned', label: 'Returned' },
                                { value: 'overdue', label: 'Overdue' },
                            ]}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Total Loans</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {records.length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Active</p>
                        <p className="text-2xl font-bold text-indigo-600">
                            {records.filter(r => r.status === 'borrowed').length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Returned</p>
                        <p className="text-2xl font-bold text-green-600">
                            {records.filter(r => r.status === 'returned').length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Overdue</p>
                        <p className="text-2xl font-bold text-red-600">
                            {records.filter(r => r.status === 'overdue' || (r.status === 'borrowed' && isPast(parseISO(r.due_date)))).length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Table
                data={filteredRecords}
                columns={columns}
                rowKey="id"
                loading={loading}
                emptyMessage="No loan records found."
            />

            {/* Return Modal */}
            <Modal
                isOpen={returnModalOpen}
                onClose={() => setReturnModalOpen(false)}
                title="Return Book"
                description="Are you sure you want to mark this book as returned?"
            >
                <div className="space-y-4">
                    {recordToReturn && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {recordToReturn.books.name}
                            </p>
                            <p className="text-sm text-gray-500">
                                Borrowed by {recordToReturn.users.name}
                            </p>
                            <div className="pt-2 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/10 p-2 rounded">
                                <Clock className="w-4 h-4" />
                                <span>
                                    This will increase available copies for this book.
                                </span>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setReturnModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button loading={returning} onClick={handleReturnBook}>
                            Confirm Return
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
