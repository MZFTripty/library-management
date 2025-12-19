'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, BookOpen, MapPin, Grid3X3, LayoutList, ChevronDown, Library, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Book, BookShelf } from '@/lib/database.types'

interface BookWithShelf extends Book {
    book_shelves: BookShelf | null
}

export default function CatalogPage() {
    const [books, setBooks] = useState<BookWithShelf[]>([])
    const [shelves, setShelves] = useState<BookShelf[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [shelfFilter, setShelfFilter] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()
            const [booksResult, shelvesResult] = await Promise.all([
                supabase.from('books').select('*, book_shelves (*)').order('name'),
                supabase.from('book_shelves').select('*').order('name'),
            ])
            if (booksResult.data) setBooks(booksResult.data as BookWithShelf[])
            if (shelvesResult.data) setShelves(shelvesResult.data)
            setLoading(false)
        }
        fetchData()
    }, [])

    const allCategories = [...new Set(books.flatMap((b) => b.categories))]

    const filteredBooks = books.filter((book) => {
        const matchesSearch =
            book.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !categoryFilter || book.categories.includes(categoryFilter)
        const matchesShelf = !shelfFilter || book.shelf_id === shelfFilter
        return matchesSearch && matchesCategory && matchesShelf
    })

    // Sample books for demo
    const sampleBooks = [
        { id: '1', name: 'The Great Gatsby', author: 'F. Scott Fitzgerald', categories: ['Fiction', 'Classic'], available: 3, total: 5 },
        { id: '2', name: 'To Kill a Mockingbird', author: 'Harper Lee', categories: ['Fiction', 'Drama'], available: 2, total: 4 },
        { id: '3', name: '1984', author: 'George Orwell', categories: ['Dystopian', 'Classic'], available: 0, total: 3 },
        { id: '4', name: 'Pride and Prejudice', author: 'Jane Austen', categories: ['Romance', 'Classic'], available: 4, total: 4 },
        { id: '5', name: 'The Catcher in the Rye', author: 'J.D. Salinger', categories: ['Fiction'], available: 1, total: 2 },
        { id: '6', name: 'Brave New World', author: 'Aldous Huxley', categories: ['Dystopian', 'Sci-Fi'], available: 2, total: 3 },
    ]

    const displayBooks = books.length > 0 ? filteredBooks : sampleBooks
    const isDemoMode = books.length === 0

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-transparent dark:bg-gradient-to-r dark:from-primary dark:to-fuchsia-500 dark:bg-clip-text">Book Catalog</h1>
                <p className="text-gray-500 dark:text-muted-foreground font-medium mt-1">
                    {isDemoMode ? 'Demo Mode - Run database schema to see real data' : `${filteredBooks.length} books available`}
                </p>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-card/30 dark:backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/5 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by title or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-lg text-gray-900 dark:text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3">
                        <div className="relative group">
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="appearance-none w-40 px-4 py-2.5 pr-10 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-lg text-gray-900 dark:text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">All Categories</option>
                                {(isDemoMode ? ['Fiction', 'Classic', 'Dystopian', 'Romance', 'Drama', 'Sci-Fi'] : allCategories).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
                        </div>

                        <div className="relative group">
                            <select
                                value={shelfFilter}
                                onChange={(e) => setShelfFilter(e.target.value)}
                                className="appearance-none w-40 px-4 py-3 pr-10 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-lg text-gray-900 dark:text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">All Shelves</option>
                                {shelves.map((shelf) => (
                                    <option key={shelf.id} value={shelf.id}>{shelf.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground pointer-events-none group-hover:text-primary transition-colors" />
                        </div>

                        {/* View Toggle */}
                        <div className="flex bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 rounded-lg overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-500 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-500 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            >
                                <LayoutList className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Demo Notice */}
            {isDemoMode && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Library className="w-5 h-5 text-amber-600" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">Demo Mode</p>
                            <p className="text-sm text-amber-600 dark:text-amber-400">Run the database schema in Supabase to see your actual books.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 animate-pulse">
                            <div className="aspect-[3/4] bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : viewMode === 'grid' ? (
                /* Grid View */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayBooks.map((book: any) => (
                        <Link
                            key={book.id}
                            href={`/catalog/${book.id}`}
                            className="group relative flex flex-col bg-card/40 backdrop-blur-xl rounded-2xl border border-white/10 dark:border-white/5 p-3 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
                        >
                            {/* Book Cover */}
                            <div className="aspect-[3/4] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                                {book.cover_image ? (
                                    <img src={book.cover_image} alt={book.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center p-2">
                                        <BookOpen className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-1" />
                                        <p className="text-xs text-gray-400 line-clamp-2">{book.name}</p>
                                    </div>
                                )}

                                {/* Availability Badge */}
                                <span className={`absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full ${(book.available_copies ?? book.available) > 0
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                    }`}>
                                    {(book.available_copies ?? book.available) > 0 ? `${book.available_copies ?? book.available} left` : 'Out'}
                                </span>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button className="px-4 py-2 bg-white text-indigo-600 text-sm font-medium rounded-lg">
                                        View Details
                                    </button>
                                </div>
                            </div>

                            {/* Book Info */}
                            <h3 className="font-bold text-foreground text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                                {book.name}
                            </h3>
                            <p className="text-muted-foreground font-medium text-[10px] mb-2">{book.author}</p>

                            {/* Categories */}
                            <div className="flex flex-wrap gap-1 mt-auto">
                                {(book.categories || []).slice(0, 2).map((cat: string) => (
                                    <span key={cat} className="px-2 py-0.5 text-[10px] bg-primary/10 text-primary font-bold rounded-lg uppercase tracking-wider">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="space-y-3">
                    {displayBooks.map((book: any) => (
                        <Link
                            key={book.id}
                            href={`/catalog/${book.id}`}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer block"
                        >
                            <div className="flex gap-4">
                                {/* Cover */}
                                <div className="w-16 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {book.cover_image ? (
                                        <img src={book.cover_image} alt={book.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <BookOpen className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{book.name}</h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm">{book.author}</p>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${(book.available_copies ?? book.available) > 0
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                            }`}>
                                            {(book.available_copies ?? book.available) > 0 ? 'Available' : 'Unavailable'}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {(book.categories || []).map((cat: string) => (
                                            <span key={cat} className="px-2 py-0.5 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
                                                {cat}
                                            </span>
                                        ))}
                                    </div>

                                    {book.book_shelves && (
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-2">
                                            <MapPin className="w-3 h-3" />
                                            {book.book_shelves.location}
                                        </p>
                                    )}
                                </div>

                                {/* Action */}
                                <div className="flex items-center">
                                    <span className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
                                        View Details
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && displayBooks.length === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No books found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    )
}
