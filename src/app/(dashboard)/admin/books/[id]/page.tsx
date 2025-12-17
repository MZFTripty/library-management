'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, User, Calendar, Package, Tag, MapPin, Edit } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, CardContent, Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Book, BookShelf } from '@/lib/database.types'
import { format } from 'date-fns'

interface BookWithShelf extends Book {
    book_shelves: BookShelf | null
}

export default function ViewBookPage() {
    const params = useParams()
    const router = useRouter()
    const [book, setBook] = useState<BookWithShelf | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBook = async () => {
            const supabase = createClient()
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

        fetchBook()
    }, [params.id])

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-blue-900 dark:to-gray-900 p-6 flex items-center justify-center">
                <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
            </div>
        )
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-blue-900 dark:to-gray-900 p-6 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Book Not Found</h2>
                    <Link href="/admin/books">
                        <Button>Back to Books</Button>
                    </Link>
                </div>
            </div>
        )
    }

    const stockStatus = book.available_copies === 0 ? 'Out of Stock' :
        book.available_copies < 3 ? 'Low Stock' : 'In Stock'
    const stockColor = book.available_copies === 0 ? 'error' :
        book.available_copies < 3 ? 'warning' : 'success'

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-blue-900 dark:to-gray-900 p-6">
            <div className="max-w-5xl mx-auto space-y-6 animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/admin/books">
                        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />}>
                            Back to Books
                        </Button>
                    </Link>
                    <Link href={`/admin/books/${book.id}/edit`}>
                        <Button icon={<Edit className="w-4 h-4" />}>
                            Edit Book
                        </Button>
                    </Link>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Book Cover & Quick Info */}
                    <Card className="lg:col-span-1">
                        <CardContent className="p-6">
                            <div className="aspect-[3/4] bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                                {book.cover_image ? (
                                    <img
                                        src={book.cover_image}
                                        alt={book.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <BookOpen className="w-20 h-20 text-indigo-400" />
                                )}
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Stock Status</p>
                                    <Badge variant={stockColor} className="mt-1">
                                        {stockStatus}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Availability</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {book.available_copies} <span className="text-base text-gray-400">/ {book.total_copies}</span>
                                    </p>
                                </div>
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
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">UID</p>
                                        <p className="font-mono font-medium text-gray-900 dark:text-white">{book.uid}</p>
                                    </div>
                                </div>

                                {book.isbn && (
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                            <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">ISBN</p>
                                            <p className="font-mono font-medium text-gray-900 dark:text-white">{book.isbn}</p>
                                        </div>
                                    </div>
                                )}

                                {book.publisher && (
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                            <User className="w-5 h-5 text-green-600 dark:text-green-400" />
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
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                            <MapPin className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                                            <p className="font-medium text-gray-900 dark:text-white">{book.book_shelves.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{book.book_shelves.location}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Added On</p>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {format(new Date(book.created_at), 'MMM d, yyyy')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
