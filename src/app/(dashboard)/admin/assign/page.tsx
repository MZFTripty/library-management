'use client'

import React, { useEffect, useState } from 'react'
import { Search, BookOpen, User, Calendar, Check, Loader2 } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Input, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Book, BookUpdate, User as UserType } from '@/lib/database.types'
import { addDays, format } from 'date-fns'

export default function AssignBookPage() {
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

    const fetchData = async () => {
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
                .in('role', ['member', 'admin'])
                .order('name'),
        ])

        if (booksResult.data) setBooks(booksResult.data)
        if (membersResult.data) setMembers(membersResult.data)
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

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

        // Create borrow record
        const { error: borrowError } = await (supabase.from('borrow_records') as any).insert({
            book_id: selectedBook,
            member_id: selectedMember,
            due_date: new Date(dueDate).toISOString(),
            notes: notes.trim() || null,
            status: 'borrowed',
        })

        if (!borrowError) {
            // Decrease available copies
            const updateData: BookUpdate = {
                available_copies: (selectedBookData?.available_copies || 1) - 1
            }

            // Cast to any to bypass strict type inference failure
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
                fetchData()
            }, 2000)
        }

        setAssigning(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-slideUp bg-gradient-to-br from-indigo-50 to-pink-200 h-screen p-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Assign Book to Member
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Issue a book to a library member
                </p>
            </div>

            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                    <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30">
                        <Check className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-green-700 dark:text-green-400">
                        Book assigned successfully!
                    </p>
                </div>
            )}

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
                                    <p className="text-center text-gray-500 py-4">No available books</p>
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
                                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {book.name}
                                            </p>
                                            <p className="text-sm text-gray-500">{book.author}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="primary" size="sm">
                                                    {book.uid}
                                                </Badge>
                                                <Badge variant={book.available_copies < 3 ? 'warning' : 'success'} size="sm">
                                                    {book.available_copies} available
                                                </Badge>
                                            </div>
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
                                            <Badge variant={member.role === 'admin' ? 'error' : 'primary'} size="sm" className="mt-2 capitalize">
                                                {member.role}
                                            </Badge>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    placeholder="Add notes about this assignment..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Summary */}
                            {(selectedBookData || selectedMemberData) && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Summary</h4>
                                    {selectedBookData && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            <span className="text-gray-500">Book:</span> {selectedBookData.name}
                                        </p>
                                    )}
                                    {selectedMemberData && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            <span className="text-gray-500">Member:</span> {selectedMemberData.name}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                        <span className="text-gray-500">Due:</span>{' '}
                                        {format(new Date(dueDate), 'MMMM d, yyyy')}
                                    </p>
                                </div>
                            )}

                            <Button
                                className="w-full"
                                loading={assigning}
                                disabled={!selectedBook || !selectedMember || !dueDate}
                                onClick={handleAssign}
                            >
                                {assigning ? 'Assigning...' : 'Assign Book'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
