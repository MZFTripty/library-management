'use client'

import React, { useEffect, useState } from 'react'
import { DollarSign, Calendar, CheckCircle, AlertTriangle, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, Modal, Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Fine, BorrowRecord, Book, User } from '@/lib/database.types'
import { format } from 'date-fns'

interface FineWithDetails extends Fine {
    borrow_records: BorrowRecord & { books: Book }
    users: User
}

export default function FinesPage() {
    const [fines, setFines] = useState<FineWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [payModalOpen, setPayModalOpen] = useState(false)
    const [fineToPay, setFineToPay] = useState<FineWithDetails | null>(null)
    const [processing, setProcessing] = useState(false)
    const [currentUser, setCurrentUser] = useState<User | null>(null)

    useEffect(() => {
        const fetchFines = async () => {
            const supabase = createClient()
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (authUser) {
                const { data: userData } = await (supabase.from('users') as any)
                    .select('*')
                    .eq('id', authUser.id)
                    .single()
                setCurrentUser(userData)

                let query = (supabase.from('fines') as any)
                    .select(`
            *,
            borrow_records (*, books (*)),
            users (*)
          `)
                    .order('created_at', { ascending: false })

                // If not admin, only show own fines
                if (userData?.role !== 'admin') {
                    query = query.eq('member_id', authUser.id)
                }

                const { data } = await query
                if (data) setFines(data as FineWithDetails[])
            }
            setLoading(false)
        }

        fetchFines()
    }, [])

    const filteredFines = fines.filter((fine) => {
        return (
            fine.users?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            fine.borrow_records?.books?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })

    const handleMarkAsPaid = async () => {
        if (!fineToPay) return

        setProcessing(true)
        const supabase = createClient()
        await (supabase.from('fines') as any)
            .update({ paid: true, paid_at: new Date().toISOString() })
            .eq('id', fineToPay.id)

        setFines(fines.map((f) => (f.id === fineToPay.id ? { ...f, paid: true, paid_at: new Date().toISOString() } : f)))
        setPayModalOpen(false)
        setFineToPay(null)
        setProcessing(false)
    }

    const totalFines = fines.reduce((acc, f) => acc + Number(f.amount), 0)
    const unpaidFines = fines.filter((f) => !f.paid).reduce((acc, f) => acc + Number(f.amount), 0)
    const paidFines = fines.filter((f) => f.paid).reduce((acc, f) => acc + Number(f.amount), 0)

    const columns = [
        {
            key: 'users' as const,
            header: 'Member',
            render: (fine: FineWithDetails) => (
                <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                        {fine.users?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">{fine.users?.email}</p>
                </div>
            ),
        },
        {
            key: 'borrow_records' as const,
            header: 'Book',
            render: (fine: FineWithDetails) => (
                <span className="text-gray-700 dark:text-gray-300">
                    {fine.borrow_records?.books?.name || 'Unknown'}
                </span>
            ),
        },
        {
            key: 'amount' as const,
            header: 'Amount',
            render: (fine: FineWithDetails) => (
                <span className="font-semibold text-red-600">${Number(fine.amount).toFixed(2)}</span>
            ),
        },
        {
            key: 'created_at' as const,
            header: 'Date',
            render: (fine: FineWithDetails) => (
                <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {format(new Date(fine.created_at), 'MMM d, yyyy')}
                </span>
            ),
        },
        {
            key: 'paid' as const,
            header: 'Status',
            render: (fine: FineWithDetails) => (
                <Badge
                    variant={fine.paid ? 'success' : 'error'}
                    dot
                >
                    {fine.paid ? 'Paid' : 'Unpaid'}
                </Badge>
            ),
        },
        {
            key: 'actions' as const,
            header: 'Actions',
            render: (fine: FineWithDetails) =>
                !fine.paid && currentUser?.role === 'admin' ? (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                            setFineToPay(fine)
                            setPayModalOpen(true)
                        }}
                    >
                        Mark Paid
                    </Button>
                ) : fine.paid_at ? (
                    <span className="text-sm text-green-600">
                        Paid on {format(new Date(fine.paid_at), 'MMM d')}
                    </span>
                ) : null,
        },
    ]

    return (
        <div className="space-y-6 animate-slideUp">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Fines & Penalties
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    {currentUser?.role === 'admin'
                        ? 'Manage overdue fines for all members'
                        : 'View your fines and payment status'}
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700">
                                <DollarSign className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Fines</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                    ${totalFines.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Unpaid</p>
                                <p className="text-2xl font-bold text-red-600">${unpaidFines.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card padding="sm">
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Collected</p>
                                <p className="text-2xl font-bold text-green-600">${paidFines.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            {currentUser?.role === 'admin' && (
                <Card padding="sm">
                    <CardContent>
                        <Input
                            placeholder="Search by member or book..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leftIcon={<Search className="w-4 h-4" />}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Table */}
            <Table
                data={filteredFines}
                columns={columns}
                rowKey="id"
                loading={loading}
                emptyMessage="No fines found."
            />

            {/* Pay Modal */}
            <Modal
                isOpen={payModalOpen}
                onClose={() => setPayModalOpen(false)}
                title="Mark Fine as Paid"
                description="Confirm that this fine has been paid"
            >
                <div className="space-y-4">
                    {fineToPay && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                            <p className="text-gray-600 dark:text-gray-300">
                                <span className="text-gray-500">Member:</span> {fineToPay.users?.name}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                                <span className="text-gray-500">Book:</span>{' '}
                                {fineToPay.borrow_records?.books?.name}
                            </p>
                            <p className="text-2xl font-bold text-red-600">${Number(fineToPay.amount).toFixed(2)}</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setPayModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button loading={processing} onClick={handleMarkAsPaid}>
                            Confirm Payment
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
