'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { BookShelf } from '@/lib/database.types'

export default function NewBookPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [shelves, setShelves] = useState<BookShelf[]>([])
    const [formData, setFormData] = useState({
        uid: '',
        name: '',
        author: '',
        description: '',
        categories: '',
        shelf_id: '',
        total_copies: 1,
        isbn: '',
        publisher: '',
        published_year: '',
        cover_image: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        const fetchShelves = async () => {
            const supabase = createClient()
            const { data } = await supabase.from('book_shelves').select('*').order('name')
            if (data) setShelves(data)
        }
        fetchShelves()
    }, [])

    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.uid.trim()) newErrors.uid = 'Book UID is required'
        if (!formData.name.trim()) newErrors.name = 'Book name is required'
        if (!formData.author.trim()) newErrors.author = 'Author is required'
        if (formData.total_copies < 1) newErrors.total_copies = 'Must have at least 1 copy'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)

        try {
            // Use API route with service role to bypass RLS
            const response = await fetch('/api/admin/books', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: formData.uid.trim(),
                    name: formData.name.trim(),
                    author: formData.author.trim(),
                    description: formData.description.trim() || null,
                    categories: formData.categories
                        .split(',')
                        .map((c) => c.trim())
                        .filter(Boolean),
                    shelf_id: formData.shelf_id || null,
                    total_copies: formData.total_copies,
                    available_copies: formData.total_copies,
                    isbn: formData.isbn.trim() || null,
                    publisher: formData.publisher.trim() || null,
                    published_year: formData.published_year ? parseInt(formData.published_year) : null,
                    cover_image: formData.cover_image.trim() || null,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                if (result.error?.includes('duplicate') || result.error?.includes('23505')) {
                    setErrors({ uid: 'This UID already exists' })
                } else {
                    setErrors({ submit: result.error || 'Failed to add book' })
                }
                return
            }

            router.push('/admin/books')
        } catch {
            setErrors({ submit: 'An unexpected error occurred' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-slideUp">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/books">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Add New Book
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Add a new book to your library collection
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Book Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Book UID *"
                                        placeholder="e.g., BK-001"
                                        value={formData.uid}
                                        onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                                        error={errors.uid}
                                        helperText="Unique identifier for the book"
                                    />
                                    <Input
                                        label="ISBN"
                                        placeholder="e.g., 978-3-16-148410-0"
                                        value={formData.isbn}
                                        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                                    />
                                </div>

                                <Input
                                    label="Book Name *"
                                    placeholder="Enter book title"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    error={errors.name}
                                />

                                <Input
                                    label="Author *"
                                    placeholder="Enter author name"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    error={errors.author}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        Description
                                    </label>
                                    <textarea
                                        placeholder="Enter book description..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={4}
                                        className="w-full px-4 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <Input
                                    label="Categories"
                                    placeholder="e.g., Fiction, Drama, Romance (comma-separated)"
                                    value={formData.categories}
                                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                                    helperText="Enter categories separated by commas"
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Input
                                        label="Publisher"
                                        placeholder="Enter publisher name"
                                        value={formData.publisher}
                                        onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                    />
                                    <Input
                                        label="Published Year"
                                        type="number"
                                        placeholder="e.g., 2024"
                                        value={formData.published_year}
                                        onChange={(e) => setFormData({ ...formData, published_year: e.target.value })}
                                        min={1800}
                                        max={new Date().getFullYear()}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Location & Stock</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Select
                                        label="Book Shelf"
                                        placeholder="Select a shelf"
                                        value={formData.shelf_id}
                                        onChange={(value) => setFormData({ ...formData, shelf_id: value })}
                                        options={shelves.map((shelf) => ({
                                            value: shelf.id,
                                            label: `${shelf.name} (${shelf.location})`,
                                        }))}
                                    />

                                    <Input
                                        label="Number of Copies *"
                                        type="number"
                                        min={1}
                                        value={formData.total_copies}
                                        onChange={(e) =>
                                            setFormData({ ...formData, total_copies: parseInt(e.target.value) || 1 })
                                        }
                                        error={errors.total_copies}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cover Image</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Input
                                    label="Cover URL"
                                    placeholder="https://..."
                                    value={formData.cover_image}
                                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                                    helperText="Enter a URL for the book cover"
                                />
                                {formData.cover_image && (
                                    <div className="mt-4">
                                        <img
                                            src={formData.cover_image}
                                            alt="Cover preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none'
                                            }}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Error Message */}
                {errors.submit && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                    <Link href="/admin/books">
                        <Button variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" loading={loading} icon={loading ? undefined : <Save className="w-4 h-4" />}>
                        {loading ? 'Saving...' : 'Save Book'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
