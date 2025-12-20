'use client'

import React, { useEffect, useState } from 'react'
import { Banknote, Calendar, CheckCircle, AlertTriangle, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Table, Modal, Button, Input } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { Fine, BorrowRecord, Book, User } from '@/lib/database.types'
import { format, differenceInDays } from 'date-fns'

interface FineWithDetails extends Fine {
    borrow_records: BorrowRecord & { books: Book }
    users: User
}

const FINE_RATE = 10 // 10 Taka per day

export default function FinesPage() {
    const [fines, setFines] = useState<FineWithDetails[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [payModalOpen, setPayModalOpen] = useState(false)
    const [fineToPay, setFineToPay] = useState<FineWithDetails | null>(null)
    const [processing, setProcessing] = useState(false)
    const [currentUser, setCurrentUser] = useState<User | null>(null)

    const fetchFines = async () => {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
            const { data: userData } = await (supabase.from('users') as any)
                .select('*')
                .eq('id', authUser.id)
                .single()
            setCurrentUser(userData)

            // AUTO-SYNC FINES
            // Fetch overdue borrow records that are not returned
            const { data: overdueLoans } = await (supabase.from('borrow_records') as any)
                .select('*, books(*)')
                .in('status', ['borrowed', 'overdue'])
                .lt('due_date', new Date().toISOString())

            if (overdueLoans && overdueLoans.length > 0) {
                for (const loan of overdueLoans) {
                    const now = new Date()
                    const dueDate = new Date(loan.due_date)
                    const overdueDays = differenceInDays(now, dueDate)

                    // If it's past the due date but less than a full day, still charge for 1 day
                    const fineDays = overdueDays > 0 ? overdueDays : (now > dueDate ? 1 : 0)

                    if (fineDays > 0) {
                        const amount = fineDays * FINE_RATE
                        // Upsert fine (using borrow_record_id as unique identifier for ongoing fines)
                        const { data: existingFines } = await (supabase.from('fines') as any)
                            .select('id, status')
                            .eq('borrow_record_id', loan.id)

                        if (existingFines && existingFines.length > 0) {
                            // Update existing ongoing fine(s)
                            // We use the first one found to ensure we don't duplicate
                            // In a perfect world we would clean up duplicates here, but for now let's just update the first one
                            const fineToUpdate = existingFines[0]

                            if (fineToUpdate.status !== 'paid') {
                                await (supabase.from('fines') as any)
                                    .update({
                                        amount,
                                        description: `Overdue fine for ${fineDays} days (৳${FINE_RATE}/day)`
                                    })
                                    .eq('id', fineToUpdate.id)
                            }
                        } else {
                            // Create new fine
                            await (supabase.from('fines') as any).insert({
                                borrow_record_id: loan.id,
                                member_id: loan.member_id,
                                amount,
                                status: 'unpaid',
                                paid: false,
                                description: `Overdue fine for ${fineDays} days (৳${FINE_RATE}/day)`
                            })
                        }
                    }
                }
            }

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

    useEffect(() => {
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
        const status = (fineToPay as any).status || (fineToPay.paid ? 'paid' : 'unpaid')

        let updateData: any = {}

        if (currentUser?.role === 'admin') {
            updateData = {
                paid: true,
                paid_at: new Date().toISOString(),
                status: 'paid'
            }
        } else {
            // Member reporting payment
            updateData = {
                status: 'reported',
                reported_at: new Date().toISOString()
            }
        }

        const { error } = await (supabase.from('fines') as any)
            .update(updateData)
            .eq('id', fineToPay.id)

        if (!error) {
            // Refresh fines list
            await fetchFines()
            setPayModalOpen(false)
            setFineToPay(null)
        }
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
                    <p className="font-bold text-foreground">
                        {fine.users?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium">{fine.users?.email}</p>
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
                <span className="font-semibold text-red-600">৳{Number(fine.amount).toFixed(2)}</span>
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
            key: 'status' as const,
            header: 'Status',
            render: (fine: FineWithDetails) => {
                const status = (fine as any).status || (fine.paid ? 'paid' : 'unpaid')
                let variant: 'default' | 'success' | 'error' | 'warning' = 'default'
                let label = 'Unpaid'

                if (status === 'paid' || fine.paid) {
                    variant = 'success'
                    label = 'Paid'
                } else if (status === 'reported') {
                    variant = 'warning'
                    label = 'Payment Reported'
                } else {
                    variant = 'error'
                    label = 'Unpaid'
                }

                return (
                    <Badge variant={variant} dot>
                        {label}
                    </Badge>
                )
            },
        },
        {
            key: 'actions' as const,
            header: 'Actions',
            render: (fine: FineWithDetails) => {
                const status = (fine as any).status || (fine.paid ? 'paid' : 'unpaid')

                if (status === 'unpaid' && currentUser?.role === 'member' && fine.member_id === currentUser.id) {
                    return (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setFineToPay(fine)
                                setPayModalOpen(true)
                            }}
                        >
                            Report Payment
                        </Button>
                    )
                }

                if (status === 'reported' && currentUser?.role === 'admin') {
                    return (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                                setFineToPay(fine)
                                setPayModalOpen(true)
                            }}
                        >
                            Confirm Receipt
                        </Button>
                    )
                }

                if (status === 'unpaid' && currentUser?.role === 'admin') {
                    return (
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
                    )
                }

                if (status === 'paid' || fine.paid_at) {
                    return (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Paid
                        </span>
                    )
                }

                return null
            },
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <Card padding="md" hover className="border-none">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-indigo-500/10">
                            <Banknote className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Fines</p>
                            <p className="text-2xl font-black text-foreground">
                                ৳{totalFines.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card padding="md" hover className="border-none">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-rose-500/10">
                            <AlertTriangle className="w-6 h-6 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Unpaid</p>
                            <p className="text-2xl font-black text-rose-500">৳{unpaidFines.toFixed(2)}</p>
                        </div>
                    </div>
                </Card>
                <Card padding="md" hover className="border-none">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-emerald-500/10">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Collected</p>
                            <p className="text-2xl font-black text-emerald-500">৳{paidFines.toFixed(2)}</p>
                        </div>
                    </div>
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
                title={currentUser?.role === 'admin' ? "Confirm Fine Payment" : "Report Fine Payment"}
                description={currentUser?.role === 'admin' ? "Confirm that this fine has been received" : "Notify the admin that you have paid this fine"}
            >
                <div className="space-y-4">
                    {fineToPay && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                            <div className="flex justify-between items-start">
                                <p className="text-gray-600 dark:text-gray-300">
                                    <span className="text-gray-500 text-xs block mb-1 uppercase tracking-widest font-bold">Book</span>
                                    {fineToPay.borrow_records?.books?.name}
                                </p>
                                <div className="text-right">
                                    <span className="text-gray-500 text-xs block mb-1 uppercase tracking-widest font-bold text-right">Amount</span>
                                    <p className="text-2xl font-bold text-red-600">৳{Number(fineToPay.amount).toFixed(2)}</p>
                                </div>
                            </div>
                            <hr className="border-gray-200 dark:border-gray-600 my-2" />
                            <p className="text-sm text-muted-foreground italic">
                                "{fineToPay.description}"
                            </p>
                        </div>
                    )}

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {currentUser?.role === 'admin'
                                ? "Ensure you have physically received the amount before confirming."
                                : "After reporting, the admin will verify and mark it as paid. This process may take some time."}
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline" onClick={() => setPayModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            loading={processing}
                            onClick={handleMarkAsPaid}
                            className={currentUser?.role === 'admin' ? "" : "bg-indigo-600"}
                        >
                            {currentUser?.role === 'admin' ? "Confirm Receipt" : "Submit Report"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
