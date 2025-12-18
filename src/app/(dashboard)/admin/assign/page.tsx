'use client'

import React, { useEffect, useState } from 'react'
import { Search, BookOpen, User, Calendar, Check, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Book, BookUpdate, User as UserType } from '@/lib/database.types'
import { addDays, format } from 'date-fns'

interface BorrowRequest {
    id: string
    book_id: string
    member_id: string
    borrowed_at: string
    due_date: string
    status: string
    books: {
        name: string
        author: string
        uid: string
        available_copies: number
    }
    users: {
        name: string
        email: string
    }
}

export default function AssignBookPage() {
    const [activeTab, setActiveTab] = useState<'pending' | 'manual'>('pending')

    // Pending Requests State
    const [pendingRequests, setPendingRequests] = useState<BorrowRequest[]>([])
    const [loadingRequests, setLoadingRequests] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    // Manual Assign State
    const [books, setBooks] = useState<Book[]>([])
    const [members, setMembers] = useState<UserType[]>([])
    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState(false)
    const [success, setSuccess] = useState(false)

    const [selectedBook, setSelectedBook] = useState<string>('')
    const [selectedMember, setSelectedMember] = useState<string>('')
    const [dueDate, setDueDate] = useState<string>(format(addDays(new Date(), 14), 'yyyy-MM-dd'))
    const [notes, setNotes] = useState('')

    const [bookSearch, setBookSearch] = useState('')
    const [memberSearch, setMemberSearch] = useState('')

    // Fetch pending requests
    const fetchPendingRequests = async () => {
        const supabase = createClient()
        const { data } = await (supabase.from('borrow_records') as any)
            .select(`
                *,
                books (name, author, uid, available_copies),
                users (name, email)
            `)
            .eq('status', 'pending')
            .order('borrowed_at', { ascending: false })

        if (data) {
            setPendingRequests(data)
        }
        setLoadingRequests(false)
    }

    // Fetch books and members for manual assign
    const fetchManualAssignData = async () => {
        const supabase = createClient()

        const [booksResult, membersResult] = await Promise.all([
            supabase
                .from('books')
                .select('*')
                .gt('available_copies', 0)
                .order('name'),
            supabase
                .from('users')
                .select('*')
                .eq('role', 'member')
                .order('name'),
        ])

        if (booksResult.data) setBooks(booksResult.data)
        if (membersResult.data) setMembers(membersResult.data)
        setLoading(false)
    }

    useEffect(() => {
        fetchPendingRequests()
        fetchManualAssignData()
    }, [])

    // Approve request
    const handleApprove = async (request: BorrowRequest) => {
        setProcessing(request.id)
        const supabase = createClient()

        // Update status to borrowed
        const { error: updateError } = await (supabase.from('borrow_records') as any)
            .update({ status: 'borrowed' })
            .eq('id', request.id)

        if (!updateError) {
            // Decrease available copies
            await (supabase.from('books') as any)
                .update({ available_copies: request.books.available_copies - 1 })
                .eq('id', request.book_id)

            // Refresh pending requests
            fetchPendingRequests()
        }
        setProcessing(null)
    }

    // Reject request
    const handleReject = async (requestId: string) => {
        setProcessing(requestId)
        const supabase = createClient()

        // Update status to rejected
        const { error } = await (supabase.from('borrow_records') as any)
            .update({ status: 'rejected' })
            .eq('id', requestId)

        if (!error) {
            fetchPendingRequests()
        }
        setProcessing(null)
    }

    // Manual assign
    const filteredBooks = books.filter(
        (book) =>
            book.name.toLowerCase().includes(bookSearch.toLowerCase()) ||
            book.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
            book.uid.toLowerCase().includes(bookSearch.toLowerCase())
    )

    const filteredMembers = members.filter(
        (member) =>
            member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
            member.email.toLowerCase().includes(memberSearch.toLowerCase())
    )

    const selectedBookData = books.find((b) => b.id === selectedBook)
    const selectedMemberData = members.find((m) => m.id === selectedMember)

    const handleAssign = async () => {
        if (!selectedBook || !selectedMember || !dueDate) return

        setAssigning(true)
        const supabase = createClient()

        // Create borrow record with borrowed status (admin approved)
        const { error: borrowError } = await (supabase.from('borrow_records') as any).insert({
            book_id: selectedBook,
            member_id: selectedMember,
            due_date: new Date(dueDate).toISOString(),
            notes: notes.trim() || null,
            status: 'borrowed', // Direct approval by admin
        })

        if (!borrowError) {
            // Decrease available copies
            const updateData: BookUpdate = {
                available_copies: (selectedBookData?.available_copies || 1) - 1
            }

            await (supabase.from('books') as any)
                .update(updateData)
                .eq('id', selectedBook)

            setSuccess(true)
            setTimeout(() => {
                setSuccess(false)
                setSelectedBook('')
                setSelectedMember('')
                setDueDate(format(addDays(new Date(), 14), 'yyyy-MM-dd'))
                setNotes('')
                fetchManualAssignData()
            }, 2000)
        }

        setAssigning(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Assign Books
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Approve pending requests or manually assign books to members
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'pending'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                            }`}
                    >
                        Pending Requests
                        {pendingRequests.length > 0 && (
                            <Badge variant="primary" className="ml-2">{pendingRequests.length}</Badge>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('manual')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'manual'
                                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
                            }`}
                    >
                        Manual Assign
                    </button>
                </nav>
            </div>

            {/* Pending Requests Tab */}
            {activeTab === 'pending' && (
                <div className="space-y-4">
                    {loadingRequests ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : pendingRequests.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No pending requests</h3>
                                <p className="text-gray-500 dark:text-gray-400">All borrow requests have been processed</p>
                            </CardContent>
                        </Card>
                    ) : (
                        pendingRequests.map((request) => (
                            <Card key={request.id}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                        {request.books.name}
                                                    </h3>
                                                    <p className="text-gray-500 dark:text-gray-400">by {request.books.author}</p>
                                                </div>
                                                <Badge variant="warning">Pending</Badge>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <User className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Member: </span>
                                                        <span className="font-medium text-gray-900 dark:text-white">{request.users.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Requested: </span>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {format(new Date(request.borrowed_at), 'MMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <BookOpen className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">UID: </span>
                                                        <span className="font-mono text-gray-900 dark:text-white">{request.books.uid}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <div>
                                                        <span className="text-gray-600 dark:text-gray-400">Due Date: </span>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {format(new Date(request.due_date), 'MMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={() => handleApprove(request)}
                                                    loading={processing === request.id}
                                                    disabled={request.books.available_copies === 0}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-2" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleReject(request.id)}
                                                    loading={processing === request.id}
                                                    className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
                                                >
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Reject
                                                </Button>
                                            </div>

                                            {request.books.available_copies === 0 && (
                                                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                                                    Cannot approve - no copies available
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* Manual Assign Tab */}
            {activeTab === 'manual' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Select Book */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-indigo-600" />
                                Select Book
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Search books..."
                                    value={bookSearch}
                                    onChange={(e) => setBookSearch(e.target.value)}
                                    leftIcon={<Search className="w-4 h-4" />}
                                />

                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {filteredBooks.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4">No books available</p>
                                    ) : (
                                        filteredBooks.map((book) => (
                                            <button
                                                key={book.id}
                                                onClick={() => setSelectedBook(book.id)}
                                                className={`w-full p-3 rounded-lg text-left transition-all ${selectedBook === book.id
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {book.name}
                                                </p>
                                                <p className="text-sm text-gray-500">{book.author}</p>
                                                <Badge variant="success" size="sm" className="mt-2">
                                                    {book.available_copies} available
                                                </Badge>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Select Member */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-600" />
                                Select Member
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Input
                                    placeholder="Search members..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                    leftIcon={<Search className="w-4 h-4" />}
                                />

                                <div className="max-h-64 overflow-y-auto space-y-2">
                                    {filteredMembers.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4">No members found</p>
                                    ) : (
                                        filteredMembers.map((member) => (
                                            <button
                                                key={member.id}
                                                onClick={() => setSelectedMember(member.id)}
                                                className={`w-full p-3 rounded-lg text-left transition-all ${selectedMember === member.id
                                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:border-gray-300'
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                    {member.name}
                                                </p>
                                                <p className="text-sm text-gray-500">{member.email}</p>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                Assignment Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <Input
                                    label="Due Date"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        rows={3}
                                        placeholder="Add any notes..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                </div>

                                {selectedBookData && selectedMemberData && (
                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                            Assignment Summary
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            <span className="font-medium">{selectedBookData.name}</span> to{' '}
                                            <span className="font-medium">{selectedMemberData.name}</span>
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                            Due: {format(new Date(dueDate), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                )}

                                <Button
                                    onClick={handleAssign}
                                    disabled={!selectedBook || !selectedMember || !dueDate}
                                    loading={assigning}
                                    className="w-full"
                                >
                                    {success ? (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Assigned Successfully!
                                        </>
                                    ) : (
                                        'Assign Book'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
