'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { Button, Card, CardContent, Input, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Book, BookShelf } from '@/lib/database.types'

export default function EditBookPage() {
    const params = useParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [shelves, setShelves] = useState<BookShelf[]>([])
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [formData, setFormData] = useState({
        uid: '',
        name: '',
        author: '',
        description: '',
        categories: '',
        shelf_id: '',
        total_copies: 1,
        available_copies: 1,
        isbn: '',
        publisher: '',
        published_year: '',
        cover_image: ''
    })

    useEffect(() => {
        const fetchData = async () => {
            const supabase = createClient()

            // Fetch book data
            const { data: bookData } = await (supabase.from('books') as any)
                .select('*')
                .eq('id', params.id)
                .single()

            if (bookData) {
                setFormData({
                    uid: bookData.uid || '',
                    name: bookData.name || '',
                    author: bookData.author || '',
                    description: bookData.description || '',
                    categories: bookData.categories?.join(', ') || '',
                    shelf_id: bookData.shelf_id || '',
                    total_copies: bookData.total_copies || 1,
                    available_copies: bookData.available_copies || 1,
                    isbn: bookData.isbn || '',
                    publisher: bookData.publisher || '',
                    published_year: bookData.published_year?.toString() || '',
                    cover_image: bookData.cover_image || ''
                })
            }

            // Fetch shelves
            const { data: shelvesData } = await (supabase.from('book_shelves') as any)
                .select('*')
                .order('name')

            if (shelvesData) {
                setShelves(shelvesData)
            }

            setLoading(false)
        }

        fetchData()
    }, [params.id])

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.uid.trim()) newErrors.uid = 'UID is required'
        if (!formData.name.trim()) newErrors.name = 'Book name is required'
        if (!formData.author.trim()) newErrors.author = 'Author is required'
        if (formData.total_copies < 1) newErrors.total_copies = 'Total copies must be at least 1'
        if (formData.available_copies < 0) newErrors.available_copies = 'Available copies cannot be negative'
        if (formData.available_copies > formData.total_copies) {
            newErrors.available_copies = 'Available copies cannot exceed total copies'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setSaving(true)

        try {
            const supabase = createClient()
            const { error } = await (supabase.from('books') as any)
                .update({
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
                    available_copies: formData.available_copies,
                    isbn: formData.isbn.trim() || null,
                    publisher: formData.publisher.trim() || null,
                    published_year: formData.published_year ? parseInt(formData.published_year) : null,
                    cover_image: formData.cover_image.trim() || null,
                })
                .eq('id', params.id)

            if (error) {
                if (error.code === '23505') {
                    setErrors({ uid: 'This UID already exists' })
                } else {
                    setErrors({ submit: error.message })
                }
                return
            }

            router.push(`/admin/books/${params.id}`)
        } catch {
            setErrors({ submit: 'An unexpected error occurred' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-blue-900 dark:to-gray-900 p-6 flex items-center justify-center">
                <div className="text-lg text-gray-600 dark:text-gray-300">Loading...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 dark:from-blue-900 dark:to-gray-900 p-6">
            <div className="max-w-4xl mx-auto space-y-6 animate-slideUp">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href={`/admin/books/${params.id}`}>
                        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />}>
                            Back to Book
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Book</h1>
                </div>

                {/* Form */}
                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {errors.submit && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                                    {errors.submit}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* UID */}
                                <Input
                                    label="Book UID *"
                                    placeholder="e.g., BK-001"
                                    value={formData.uid}
                                    onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                                    error={errors.uid}
                                />

                                {/* ISBN */}
                                <Input
                                    label="ISBN"
                                    placeholder="e.g., 978-0-123456-78-9"
                                    value={formData.isbn}
                                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                                />

                                {/* Name */}
                                <Input
                                    label="Book Name *"
                                    placeholder="Enter book title"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    error={errors.name}
                                    className="md:col-span-2"
                                />

                                {/* Author */}
                                <Input
                                    label="Author *"
                                    placeholder="Enter author name"
                                    value={formData.author}
                                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                                    error={errors.author}
                                />

                                {/* Publisher */}
                                <Input
                                    label="Publisher"
                                    placeholder="Enter publisher name"
                                    value={formData.publisher}
                                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                                />

                                {/* Published Year */}
                                <Input
                                    label="Published Year"
                                    type="number"
                                    placeholder="e.g., 2024"
                                    value={formData.published_year}
                                    onChange={(e) => setFormData({ ...formData, published_year: e.target.value })}
                                />

                                {/* Shelf */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Shelf Location
                                    </label>
                                    <Select
                                        value={formData.shelf_id}
                                        onChange={(value) => setFormData({ ...formData, shelf_id: value })}
                                        options={[
                                            { value: '', label: 'No Shelf Assigned' },
                                            ...shelves.map((shelf) => ({
                                                value: shelf.id,
                                                label: `${shelf.name} - ${shelf.location}`
                                            }))
                                        ]}
                                    />
                                </div>

                                {/* Total Copies */}
                                <Input
                                    label="Total Copies *"
                                    type="number"
                                    min={1}
                                    value={formData.total_copies}
                                    onChange={(e) => setFormData({ ...formData, total_copies: parseInt(e.target.value) || 1 })}
                                    error={errors.total_copies}
                                />

                                {/* Available Copies */}
                                <Input
                                    label="Available Copies *"
                                    type="number"
                                    min={0}
                                    value={formData.available_copies}
                                    onChange={(e) => setFormData({ ...formData, available_copies: parseInt(e.target.value) || 0 })}
                                    error={errors.available_copies}
                                />

                                {/* Categories */}
                                <Input
                                    label="Categories"
                                    placeholder="e.g., Fiction, Mystery, Thriller"
                                    helperText="Separate multiple categories with commas"
                                    value={formData.categories}
                                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                                    className="md:col-span-2"
                                />

                                {/* Cover Image URL */}
                                <Input
                                    label="Cover Image URL"
                                    placeholder="https://example.com/cover.jpg"
                                    value={formData.cover_image}
                                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                                    className="md:col-span-2"
                                />

                                {/* Description */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[120px]"
                                        placeholder="Enter book description..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <Link href={`/admin/books/${params.id}`}>
                                    <Button variant="outline">Cancel</Button>
                                </Link>
                                <Button type="submit" loading={saving} icon={<Save className="w-4 h-4" />}>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
