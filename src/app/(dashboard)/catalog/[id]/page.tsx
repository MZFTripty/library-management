'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, User, Calendar, Package, Tag, MapPin, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, CardContent, Badge, Modal, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Book, BookShelf, User as UserType } from '@/lib/database.types'
import { format, addDays } from 'date-fns'

interface BookWithShelf extends Book {
    book_shelves: BookShelf | null
}

export default function CatalogBookDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [book, setBook] = useState<BookWithShelf | null>(null)
    const [loading, setLoading] = useState(true)
    const [borrowModalOpen, setBorrowModalOpen] = useState(false)
    const [borrowing, setBorrowing] = useState(false)
    const [borrowDays, setBorrowDays] = useState(14)
    const [currentUser, setCurrentUser] = useState<UserType | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            // Get current user
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (authUser) {
                const { data: userData } = await (supabase.from('users') as any)
                    .select('*')
                    .eq('id', authUser.id)
                    .single()
                setCurrentUser(userData)
            }

            // Get book data
            const { data } = await (supabase.from('books') as any)
                .select(`
                    *,
                    book_shelves (*)
                `)
                .eq('id', params.id)
                .single()

            if (data) {
                setBook(data as BookWithShelf)
            }
            setLoading(false)
        }

        fetchData()
    }, [params.id])

    const handleBorrow = async () => {
        if (!book || !currentUser) return

        setBorrowing(true)
        setError('')

        try {
            const supabase = createClient()
            const borrowedAt = new Date()
            const dueDate = addDays(borrowedAt, borrowDays)

            // Create PENDING borrow request (not borrowed yet)
            const { error: borrowError } = await (supabase.from('borrow_records') as any)
                .insert({
                    book_id: book.id,
                    member_id: currentUser.id,
                    borrowed_at: borrowedAt.toISOString(),
                    due_date: dueDate.toISOString(),
                    status: 'pending' // Changed from 'borrowed' to 'pending'
                })

            if (borrowError) {
                setError(borrowError.message)
                return
            }

            // DO NOT decrease available_copies - admin will do this on approval

            // Success - redirect to my requests page
            setBorrowModalOpen(false)
            router.push('/member/requests')
        } catch (err: any) {
            setError(err.message || 'Failed to submit borrow request')
        } finally {
            setBorrowing(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900 dark:to-gray-900 p-6 flex items-center justify-center">
                <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
            </div>
        )
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900 dark:to-gray-900 p-6 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Book Not Found</h2>
                    <Link href="/catalog">
                        <Button>Back to Catalog</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const isAvailable = book.available_copies > 0
    const stockStatus = book.available_copies === 0 ? 'Out of Stock' :
        book.available_copies < 3 ? 'Low Stock' : 'In Stock'
    const stockColor = book.available_copies === 0 ? 'error' :
        book.available_copies < 3 ? 'warning' : 'success'

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900 dark:to-gray-900 p-6">
            <div className="max-w-5xl mx-auto space-y-6 animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/catalog">
                        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />}>
                            Back to Catalog
                        </Button>
                    </Link>
                    {isAvailable && currentUser?.role === 'member' && (
                        <Button
                            onClick={() => setBorrowModalOpen(true)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Borrow This Book
                        </Button>
                    )}
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Book Cover & Quick Info */}
                    <Card className="lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="aspect-[3/4] bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden shadow-lg">
                                {book.cover_image ? (
                                    <img
                                        src={book.cover_image}
                                        alt={book.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <BookOpen className="w-20 h-20 text-purple-400" />
                                )}
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Availability</p>
                                    <Badge variant={stockColor} className="mt-1">
                                        {stockStatus}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Copies Available</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {book.available_copies} <span className="text-base text-gray-400">/ {book.total_copies}</span>
                                    </p>
                                </div>
                                {!isAvailable && (
                                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Currently unavailable</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Book Details */}
                    <Card className="lg:col-span-2">
                        <CardContent className="p-6 space-y-6">
                            {/* Title & Author */}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {book.name}
                                </h1>
                                <div className="flex items-center gap-2 text-lg text-gray-600 dark:text-gray-300">
                                    <User className="w-5 h-5" />
                                    <span>by {book.author}</span>
                                </div>
                            </div>

                            {/* Categories */}
                            {book.categories && book.categories.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Categories</p>
                                    <div className="flex flex-wrap gap-2">
                                        {book.categories.map((category) => (
                                            <Badge key={category} variant="primary">
                                                <Tag className="w-3 h-3 mr-1" />
                                                {category}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {book.description && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</p>
                                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                        {book.description}
                                    </p>
                                </div>
                            )}

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">UID</p>
                                        <p className="font-mono font-medium text-gray-900 dark:text-white">{book.uid}</p>
                                    </div>
                                </div>

                                {book.isbn && (
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                            <Package className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">ISBN</p>
                                            <p className="font-mono font-medium text-gray-900 dark:text-white">{book.isbn}</p>
                                        </div>
                                    </div>
                                )}

                                {book.publisher && (
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Publisher</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{book.publisher}</p>
                                        </div>
                                    </div>
                                )}

                                {book.published_year && (
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Published Year</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{book.published_year}</p>
                                        </div>
                                    </div>
                                )}

                                {book.book_shelves && (
                                    <div className="flex items-start gap-3 md:col-span-2">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{book.book_shelves.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{book.book_shelves.location}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Borrow Modal */}
            <Modal
                isOpen={borrowModalOpen}
                onClose={() => setBorrowModalOpen(false)}
                title="Request to Borrow Book"
                description="Submit a borrow request for admin approval"
            >
                <div className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{book.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">by {book.author}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Borrow Duration (days)
                        </label>
                        <Input
                            type="number"
                            min={1}
                            max={30}
                            value={borrowDays}
                            onChange={(e) => setBorrowDays(parseInt(e.target.value) || 14)}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Due date: {format(addDays(new Date(), borrowDays), 'MMM d, yyyy')}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span>Late returns incur a fine of ৳10 per day</span>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setBorrowModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            loading={borrowing}
                            onClick={handleBorrow}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            Submit Request
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
