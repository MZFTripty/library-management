'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, Edit, Trash2, Eye, BookOpen } from 'lucide-react'
import { Button, Card, CardContent, Badge, Table, Modal, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Book, BookShelf } from '@/lib/database.types'

interface BookWithShelf extends Book {
    book_shelves: BookShelf | null
}

export default function BooksPage() {
    const [books, setBooks] = useState<BookWithShelf[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchBooks = async () => {
        const supabase = createClient()
        const { data } = await (supabase.from('books') as any)
            .select(`
        *,
        book_shelves (*)
      `)
            .order('created_at', { ascending: false })

        if (data) {
            setBooks(data as BookWithShelf[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchBooks()
    }, [])

    const filteredBooks = books.filter(
        (book) =>
            book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.uid.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleDelete = async () => {
        if (!bookToDelete) return

        setDeleting(true)
        const supabase = createClient()
        await (supabase.from('books') as any).delete().eq('id', bookToDelete.id)
        setBooks(books.filter((b) => b.id !== bookToDelete.id))
        setDeleteModalOpen(false)
        setBookToDelete(null)
        setDeleting(false)
    }

    const columns = [
        {
            key: 'name' as const,
            header: 'Book',
            sortable: true,
            render: (book: BookWithShelf) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-14 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {book.cover_image ? (
                            <img
                                src={book.cover_image}
                                alt={book.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <BookOpen className="w-5 h-5 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{book.name}</p>
                        <p className="text-sm text-gray-500">{book.author}</p>
                    </div>
                </div>
            ),
        },
        {
            key: 'uid' as const,
            header: 'UID',
            render: (book: BookWithShelf) => (
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    {book.uid}
                </code>
            ),
        },
        {
            key: 'categories' as const,
            header: 'Categories',
            render: (book: BookWithShelf) => (
                <div className="flex flex-wrap gap-1">
                    {book.categories.slice(0, 2).map((cat) => (
                        <Badge key={cat} variant="primary" size="sm">
                            {cat}
                        </Badge>
                    ))}
                    {book.categories.length > 2 && (
                        <Badge variant="default" size="sm">
                            +{book.categories.length - 2}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'book_shelves' as const,
            header: 'Location',
            render: (book: BookWithShelf) => (
                <span className="text-gray-600 dark:text-gray-300">
                    {book.book_shelves?.name || 'Unassigned'}
                </span>
            ),
        },
        {
            key: 'available_copies' as const,
            header: 'Stock',
            render: (book: BookWithShelf) => (
                <div className="flex items-center gap-2">
                    <span
                        className={`font-medium ${book.available_copies === 0
                            ? 'text-red-600'
                            : book.available_copies < 3
                                ? 'text-amber-600'
                                : 'text-green-600'
                            }`}
                    >
                        {book.available_copies}
                    </span>
                    <span className="text-gray-400">/ {book.total_copies}</span>
                </div>
            ),
        },
        {
            key: 'actions' as const,
            header: 'Actions',
            render: (book: BookWithShelf) => (
                <div className="flex items-center gap-1">
                    <Link href={`/admin/books/${book.id}`}>
                        <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Link href={`/admin/books/${book.id}/edit`}>
                        <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setBookToDelete(book)
                            setDeleteModalOpen(true)
                        }}
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                </div>
            ),
        },
    ]

    return (
        <div className="space-y-6 animate-slideUp bg-gradient-to-br from-blue-50 to-blue-200 dark:from-blue-800 dark:to-blue-900 dark:text-white min-h-screen p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Book Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Manage your library&apos;s book collection
                    </p>
                </div>
                <Link href="/admin/books/new">
                    <Button icon={<Plus className="w-4 h-4" />}>Add Book</Button>
                </Link>
            </div>

            {/* Filters */}
            <Card padding="sm">
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search books by title, author, or UID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                leftIcon={<Search className="w-4 h-4" />}
                            />
                        </div>
                        <Button variant="outline" icon={<Filter className="w-4 h-4" />}>
                            Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Total Books</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {books.length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Available</p>
                        <p className="text-2xl font-bold text-green-600">
                            {books.filter((b) => b.available_copies > 0).length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Out of Stock</p>
                        <p className="text-2xl font-bold text-red-600">
                            {books.filter((b) => b.available_copies === 0).length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Total Copies</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {books.reduce((acc, b) => acc + b.total_copies, 0)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Table
                data={filteredBooks}
                columns={columns}
                rowKey="id"
                loading={loading}
                emptyMessage="No books found. Add your first book to get started."
            />

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Book"
                description="Are you sure you want to delete this book? This action cannot be undone."
            >
                <div className="space-y-4">
                    {bookToDelete && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {bookToDelete.name}
                            </p>
                            <p className="text-sm text-gray-500">{bookToDelete.author}</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>
                            Delete Book
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
