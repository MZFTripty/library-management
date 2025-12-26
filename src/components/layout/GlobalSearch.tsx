'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Book, User as UserIcon, Loader2, X, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/lib/database.types'

interface SearchResult {
    id: string
    title: string
    subtitle: string
    type: 'book' | 'member'
    href: string
}

export function GlobalSearch({ currentUser }: { currentUser: User | null }) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Debounced search logic
    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults([])
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            const supabase = createClient()

            try {
                const searchResults: SearchResult[] = []

                // 1. Search Books
                const { data: books } = await supabase
                    .from('books')
                    .select('id, name, author, categories')
                    .or(`name.ilike.%${query}%,author.ilike.%${query}%,categories.cs.{${query}}`)
                    .limit(5) as { data: any[] | null }

                if (books) {
                    books.forEach((book: any) => {
                        searchResults.push({
                            id: book.id,
                            title: book.name,
                            subtitle: `${book.author} • ${book.categories?.join(', ') || ''}`,
                            type: 'book',
                            href: `/catalog/${book.id}`
                        })
                    })
                }

                // 2. Search Members (Only for Admins)
                if (currentUser?.role === 'admin') {
                    const { data: members } = await supabase
                        .from('users')
                        .select('id, name, email')
                        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
                        .limit(5) as { data: any[] | null }

                    if (members) {
                        members.forEach((member: any) => {
                            searchResults.push({
                                id: member.id,
                                title: member.name,
                                subtitle: member.email,
                                type: 'member',
                                href: `/admin/members?search=${encodeURIComponent(member.email)}`
                            })
                        })
                    }
                }

                setResults(searchResults)
            } catch (error) {
                console.error('Search error:', error)
            } finally {
                setIsLoading(false)
            }
        }

        const debounceTimer = setTimeout(() => {
            fetchResults()
        }, 300)

        return () => clearTimeout(debounceTimer)
    }, [query, currentUser])

    const handleSelect = (href: string) => {
        router.push(href)
        setIsOpen(false)
        setQuery('')
    }

    return (
        <div className="relative w-full max-w-xl" ref={dropdownRef}>
            <div className="relative group">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-200 ${isOpen ? 'text-indigo-500' : 'text-gray-400 group-focus-within:text-indigo-500'}`} />
                <input
                    ref={searchRef}
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search books, authors, categories..."
                    className="w-full pl-12 pr-12 py-3 bg-gray-100/50 dark:bg-gray-800/40 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 backdrop-blur-sm"
                />

                {/* Right actions (loading or clear) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                    ) : query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-4 h-4 text-gray-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* Dropdown Results */}
            {isOpen && (query.trim().length >= 2 || results.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[400px] overflow-y-auto">
                        {results.length > 0 ? (
                            <div className="p-2 space-y-1">
                                {results.map((result) => (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result.href)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-white/5 transition-all group text-left"
                                    >
                                        <div className={`p-2 rounded-lg ${result.type === 'book'
                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                            }`}>
                                            {result.type === 'book' ? <Book className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                {result.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {result.subtitle}
                                            </p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        ) : query.trim().length >= 2 && !isLoading ? (
                            <div className="py-12 text-center">
                                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-20" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
                            </div>
                        ) : null}
                    </div>

                    {/* Footer / Quick Tip */}
                    {results.length > 0 && (
                        <div className="p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 text-[10px] text-gray-500 dark:text-gray-400 flex justify-between items-center">
                            <span>Press ESC to close</span>
                            <span className="flex items-center gap-1">
                                Showing top matches
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
