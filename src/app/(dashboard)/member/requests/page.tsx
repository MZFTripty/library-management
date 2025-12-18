'use client'

import React, { useEffect, useState } from 'react'
import { Clock, BookOpen, Calendar, X, CheckCircle, XCircle } from 'lucide-react'
import { Button, Card, CardContent, Badge } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

interface BorrowRequest {
    id: string
    book_id: string
    member_id: string
    borrowed_at: string
    due_date: string
    status: string
    books: {
        name: string
        author: string
        uid: string
    }
}

export default function MemberRequestsPage() {
    const [requests, setRequests] = useState<BorrowRequest[]>([])
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState<string | null>(null)

    const fetchRequests = async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const { data } = await (supabase.from('borrow_records') as any)
                .select(`
                    *,
                    books (name, author, uid)
                `)
                .eq('member_id', user.id)
                .order('borrowed_at', { ascending: false })

            if (data) {
                setRequests(data)
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchRequests()
    }, [])

    const handleCancel = async (requestId: string) => {
        setCancelling(requestId)
        const supabase = createClient()

        const { error } = await (supabase.from('borrow_records') as any)
            .delete()
            .eq('id', requestId)
            .eq('status', 'pending') // Only allow cancelling pending requests

        if (!error) {
            setRequests(requests.filter(r => r.id !== requestId))
        }
        setCancelling(null)
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending Approval</Badge>
            case 'borrowed':
                return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
            case 'rejected':
                return <Badge variant="error"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
            case 'returned':
                return <Badge variant="primary">Returned</Badge>
            case 'overdue':
                return <Badge variant="error">Overdue</Badge>
            default:
                return <Badge>{status}</Badge>
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-gray-500">Loading requests...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Borrow Requests</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Track your book borrow requests and their approval status
                </p>
            </div>

            {requests.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No requests yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Browse the catalog to request books</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => (
                        <Card key={request.id}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                    {request.books.name}
                                                </h3>
                                                <p className="text-gray-500 dark:text-gray-400">by {request.books.author}</p>
                                            </div>
                                            {getStatusBadge(request.status)}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <BookOpen className="w-4 h-4" />
                                                <span>UID: {request.books.uid}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Calendar className="w-4 h-4" />
                                                <span>Requested: {format(new Date(request.borrowed_at), 'MMM d, yyyy')}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Clock className="w-4 h-4" />
                                                <span>Due: {format(new Date(request.due_date), 'MMM d, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {request.status === 'pending' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleCancel(request.id)}
                                            loading={cancelling === request.id}
                                            className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
