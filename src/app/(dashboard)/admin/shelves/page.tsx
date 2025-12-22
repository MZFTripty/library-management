'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, MapPin, Archive } from 'lucide-react'
import { Button, Card, CardContent, Badge, Table, Modal, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { BookShelf } from '@/lib/database.types'

interface ShelfWithBookCount extends BookShelf {
    book_count: number
}

export default function ShelvesPage() {
    const [shelves, setShelves] = useState<ShelfWithBookCount[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [shelfToDelete, setShelfToDelete] = useState<BookShelf | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [newShelf, setNewShelf] = useState({ name: '', location: '', description: '', capacity: 100 })
    const [adding, setAdding] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [shelfToEdit, setShelfToEdit] = useState<ShelfWithBookCount | null>(null)
    const [editedShelf, setEditedShelf] = useState({ name: '', location: '', description: '', capacity: 100 })
    const [updating, setUpdating] = useState(false)

    const fetchShelves = async () => {
        const supabase = createClient()
        const { data: shelvesData } = await (supabase.from('book_shelves') as any)
            .select('*')
            .order('name')

        if (shelvesData) {
            // Get book counts for each shelf
            const shelvesWithCounts = await Promise.all(
                shelvesData.map(async (shelf: any) => {
                    const { count } = await (supabase.from('books') as any)
                        .select('*', { count: 'exact', head: true })
                        .eq('shelf_id', shelf.id)
                    return { ...shelf, book_count: count || 0 }
                })
            )
            setShelves(shelvesWithCounts)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchShelves()
    }, [])

    const filteredShelves = shelves.filter(
        (shelf) =>
            shelf.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shelf.location.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleDelete = async () => {
        if (!shelfToDelete) return

        setDeleting(true)
        const supabase = createClient()
        await (supabase.from('book_shelves') as any).delete().eq('id', shelfToDelete.id)
        setShelves(shelves.filter((s) => s.id !== shelfToDelete.id))
        setDeleteModalOpen(false)
        setShelfToDelete(null)
        setDeleting(false)
    }

    const handleAddShelf = async () => {
        if (!newShelf.name.trim() || !newShelf.location.trim()) return

        setAdding(true)
        const supabase = createClient()
        const { data, error } = await (supabase.from('book_shelves') as any)
            .insert({
                name: newShelf.name.trim(),
                location: newShelf.location.trim(),
                description: newShelf.description.trim() || null,
                capacity: newShelf.capacity,
            })
            .select()
            .single()

        if (!error && data) {
            setShelves([...shelves, { ...data, book_count: 0 }])
            setAddModalOpen(false)
            setNewShelf({ name: '', location: '', description: '', capacity: 100 })
        }
        setAdding(false)
    }

    const handleEditShelf = async () => {
        if (!shelfToEdit || !editedShelf.name.trim() || !editedShelf.location.trim()) return

        setUpdating(true)
        const supabase = createClient()
        const { data, error } = await (supabase.from('book_shelves') as any)
            .update({
                name: editedShelf.name.trim(),
                location: editedShelf.location.trim(),
                description: editedShelf.description.trim() || null,
                capacity: editedShelf.capacity,
            })
            .eq('id', shelfToEdit.id)
            .select()
            .single()

        if (!error && data) {
            setShelves(shelves.map(s => s.id === shelfToEdit.id ? { ...data, book_count: shelfToEdit.book_count } : s))
            setEditModalOpen(false)
            setShelfToEdit(null)
        }
        setUpdating(false)
    }

    const columns = [
        {
            key: 'name' as const,
            header: 'Shelf Name',
            sortable: true,
            render: (shelf: ShelfWithBookCount) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                        <Archive className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{shelf.name}</p>
                        {shelf.description && (
                            <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                {shelf.description}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'location' as const,
            header: 'Location',
            render: (shelf: ShelfWithBookCount) => (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {shelf.location}
                </div>
            ),
        },
        {
            key: 'book_count' as const,
            header: 'Books',
            render: (shelf: ShelfWithBookCount) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                        {shelf.book_count}
                    </span>
                    <span className="text-gray-400">/ {shelf.capacity}</span>
                </div>
            ),
        },
        {
            key: 'capacity' as const,
            header: 'Usage',
            render: (shelf: ShelfWithBookCount) => {
                const usage = (shelf.book_count / shelf.capacity) * 100
                return (
                    <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${usage > 90
                                    ? 'bg-red-500'
                                    : usage > 70
                                        ? 'bg-amber-500'
                                        : 'bg-green-500'
                                    }`}
                                style={{ width: `${Math.min(usage, 100)}%` }}
                            />
                        </div>
                        <span className="text-sm text-gray-500">{usage.toFixed(0)}%</span>
                    </div>
                )
            },
        },
        {
            key: 'actions' as const,
            header: 'Actions',
            render: (shelf: ShelfWithBookCount) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShelfToEdit(shelf)
                            setEditedShelf({
                                name: shelf.name,
                                location: shelf.location,
                                description: shelf.description || '',
                                capacity: shelf.capacity
                            })
                            setEditModalOpen(true)
                        }}
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setShelfToDelete(shelf)
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
        <div className="space-y-6 animate-slideUp">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Shelf Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Organize your library&apos;s book shelves
                    </p>
                </div>
                <Button icon={<Plus className="w-4 h-4" />} onClick={() => setAddModalOpen(true)}>
                    Add Shelf
                </Button>
            </div>

            {/* Search */}
            <Card padding="sm">
                <CardContent>
                    <Input
                        placeholder="Search shelves by name or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search className="w-4 h-4" />}
                    />
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Total Shelves</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {shelves.length}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Total Capacity</p>
                        <p className="text-2xl font-bold text-indigo-600">
                            {shelves.reduce((acc, s) => acc + s.capacity, 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Books Stored</p>
                        <p className="text-2xl font-bold text-green-600">
                            {shelves.reduce((acc, s) => acc + s.book_count, 0)}
                        </p>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <p className="text-sm text-gray-500">Avg Usage</p>
                        <p className="text-2xl font-bold text-amber-600">
                            {shelves.length > 0
                                ? (
                                    (shelves.reduce((acc, s) => acc + s.book_count, 0) /
                                        shelves.reduce((acc, s) => acc + s.capacity, 0)) *
                                    100
                                ).toFixed(1)
                                : 0}
                            %
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Table
                data={filteredShelves}
                columns={columns}
                rowKey="id"
                loading={loading}
                emptyMessage="No shelves found. Add your first shelf to organize books."
            />

            {/* Add Modal */}
            <Modal
                isOpen={addModalOpen}
                onClose={() => setAddModalOpen(false)}
                title="Add New Shelf"
                description="Create a new shelf to organize your books"
            >
                <div className="space-y-4">
                    <Input
                        label="Shelf Name *"
                        placeholder="e.g., Fiction Section A"
                        value={newShelf.name}
                        onChange={(e) => setNewShelf({ ...newShelf, name: e.target.value })}
                    />
                    <Input
                        label="Location *"
                        placeholder="e.g., First Floor, Row 1"
                        value={newShelf.location}
                        onChange={(e) => setNewShelf({ ...newShelf, location: e.target.value })}
                    />
                    <Input
                        label="Description"
                        placeholder="Optional description..."
                        value={newShelf.description}
                        onChange={(e) => setNewShelf({ ...newShelf, description: e.target.value })}
                    />
                    <Input
                        label="Capacity"
                        type="number"
                        min={1}
                        value={newShelf.capacity}
                        onChange={(e) => setNewShelf({ ...newShelf, capacity: parseInt(e.target.value) || 100 })}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setAddModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button loading={adding} onClick={handleAddShelf}>
                            Add Shelf
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false)
                    setShelfToEdit(null)
                }}
                title="Edit Shelf"
                description="Update shelf information"
            >
                <div className="space-y-4">
                    <Input
                        label="Shelf Name *"
                        placeholder="e.g., Fiction Section A"
                        value={editedShelf.name}
                        onChange={(e) => setEditedShelf({ ...editedShelf, name: e.target.value })}
                    />
                    <Input
                        label="Location *"
                        placeholder="e.g., First Floor, Row 1"
                        value={editedShelf.location}
                        onChange={(e) => setEditedShelf({ ...editedShelf, location: e.target.value })}
                    />
                    <Input
                        label="Description"
                        placeholder="Optional description..."
                        value={editedShelf.description}
                        onChange={(e) => setEditedShelf({ ...editedShelf, description: e.target.value })}
                    />
                    <Input
                        label="Capacity"
                        type="number"
                        min={1}
                        value={editedShelf.capacity}
                        onChange={(e) => setEditedShelf({ ...editedShelf, capacity: parseInt(e.target.value) || 100 })}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => {
                            setEditModalOpen(false)
                            setShelfToEdit(null)
                        }}>
                            Cancel
                        </Button>
                        <Button loading={updating} onClick={handleEditShelf}>
                            Update Shelf
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Shelf"
                description="Are you sure you want to delete this shelf?"
            >
                <div className="space-y-4">
                    {shelfToDelete && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {shelfToDelete.name}
                            </p>
                            <p className="text-sm text-gray-500">{shelfToDelete.location}</p>
                        </div>
                    )}
                    <p className="text-sm text-amber-600">
                        Note: Books assigned to this shelf will be unassigned.
                    </p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" loading={deleting} onClick={handleDelete}>
                            Delete Shelf
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
