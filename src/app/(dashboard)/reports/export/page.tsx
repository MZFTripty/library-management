'use client'

import React, { useState } from 'react'
import { Download, FileText, Table, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button, Select } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

export default function ExportPage() {
    const [reportType, setReportType] = useState('borrows')
    const [period, setPeriod] = useState('month')
    const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null)
    const [success, setSuccess] = useState(false)

    const getDateRange = () => {
        const now = new Date()
        const startDate = new Date()
        if (period === 'day') {
            startDate.setDate(now.getDate() - 1)
        } else if (period === 'month') {
            startDate.setMonth(now.getMonth() - 1)
        } else if (period === 'year') {
            startDate.setFullYear(now.getFullYear() - 1)
        }
        return { startDate, endDate: now }
    }

    const fetchData = async () => {
        const supabase = createClient()
        const { startDate, endDate } = getDateRange()

        switch (reportType) {
            case 'borrows':
                const { data: borrows } = await supabase
                    .from('borrow_records')
                    .select('*, books(name, author), users(name, email)')
                    .gte('borrowed_at', startDate.toISOString())
                    .lte('borrowed_at', endDate.toISOString())
                return borrows?.map((b: {
                    books: { name: string; author: string } | null;
                    users: { name: string; email: string } | null;
                    borrowed_at: string;
                    due_date: string;
                    returned_at: string | null;
                    status: string;
                }) => ({
                    'Book Name': b.books?.name || 'N/A',
                    'Author': b.books?.author || 'N/A',
                    'Member': b.users?.name || 'N/A',
                    'Email': b.users?.email || 'N/A',
                    'Borrowed Date': format(new Date(b.borrowed_at), 'MMM d, yyyy'),
                    'Due Date': format(new Date(b.due_date), 'MMM d, yyyy'),
                    'Returned': b.returned_at ? format(new Date(b.returned_at), 'MMM d, yyyy') : '-',
                    'Status': b.status,
                })) || []

            case 'books':
                const { data: books } = await supabase.from('books').select('*, book_shelves(name, location)')
                return books?.map((b: {
                    uid: string;
                    name: string;
                    author: string;
                    categories: string[];
                    total_copies: number;
                    available_copies: number;
                    book_shelves: { name: string; location: string } | null;
                }) => ({
                    'UID': b.uid,
                    'Name': b.name,
                    'Author': b.author,
                    'Categories': b.categories.join(', '),
                    'Total Copies': b.total_copies,
                    'Available': b.available_copies,
                    'Shelf': b.book_shelves?.name || 'Unassigned',
                    'Location': b.book_shelves?.location || '-',
                })) || []

            case 'members':
                const { data: members } = await supabase.from('users').select('*')
                return members?.map((m: {
                    name: string;
                    email: string;
                    role: string;
                    created_at: string;
                }) => ({
                    'Name': m.name,
                    'Email': m.email,
                    'Role': m.role,
                    'Joined': format(new Date(m.created_at), 'MMM d, yyyy'),
                })) || []

            case 'fines':
                const { data: fines } = await supabase
                    .from('fines')
                    .select('*, users(name, email), borrow_records(books(name))')
                return fines?.map((f: {
                    users: { name: string; email: string } | null;
                    borrow_records: { books: { name: string } | null } | null;
                    amount: number;
                    paid: boolean;
                    created_at: string;
                    paid_at: string | null;
                }) => ({
                    'Member': f.users?.name || 'N/A',
                    'Email': f.users?.email || 'N/A',
                    'Book': f.borrow_records?.books?.name || 'N/A',
                    'Amount': `$${Number(f.amount).toFixed(2)}`,
                    'Status': f.paid ? 'Paid' : 'Unpaid',
                    'Date': format(new Date(f.created_at), 'MMM d, yyyy'),
                    'Paid On': f.paid_at ? format(new Date(f.paid_at), 'MMM d, yyyy') : '-',
                })) || []

            default:
                return []
        }
    }

    const exportToPDF = async () => {
        setExporting('pdf')
        const data = await fetchData()

        const doc = new jsPDF()
        const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`

        doc.setFontSize(18)
        doc.text(title, 14, 20)

        doc.setFontSize(10)
        doc.text(`Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 14, 28)
        doc.text(`Period: ${period === 'day' ? 'Last 24 Hours' : period === 'month' ? 'Last Month' : 'Last Year'}`, 14, 34)

        if (data.length > 0) {
            const headers = Object.keys(data[0])
            const rows = data.map((row: Record<string, unknown>) => Object.values(row).map(v => String(v)))

            let y = 45
            doc.setFontSize(8)

            // Header
            doc.setFillColor(99, 102, 241)
            doc.rect(14, y - 5, 182, 8, 'F')
            doc.setTextColor(255, 255, 255)
            const colWidth = 182 / headers.length
            headers.forEach((header, i) => {
                doc.text(header.substring(0, 12), 14 + i * colWidth + 2, y)
            })

            // Rows
            doc.setTextColor(0, 0, 0)
            y += 10
            rows.forEach((row, rowIndex) => {
                if (y > 280) {
                    doc.addPage()
                    y = 20
                }
                if (rowIndex % 2 === 0) {
                    doc.setFillColor(248, 250, 252)
                    doc.rect(14, y - 5, 182, 8, 'F')
                }
                row.forEach((cell, i) => {
                    doc.text(String(cell).substring(0, 15), 14 + i * colWidth + 2, y)
                })
                y += 8
            })
        }

        doc.save(`${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
        setExporting(null)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
    }

    const exportToExcel = async () => {
        setExporting('excel')
        const data = await fetchData()

        const ws = XLSX.utils.json_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Report')
        XLSX.writeFile(wb, `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)

        setExporting(null)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-slideUp">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Export Reports
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Generate and download reports in PDF or Excel format
                </p>
            </div>

            {success && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-700 dark:text-green-400">Report exported successfully!</p>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Report Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Select
                            label="Report Type"
                            value={reportType}
                            onChange={setReportType}
                            options={[
                                { value: 'borrows', label: 'Borrowing Records' },
                                { value: 'books', label: 'Book Inventory' },
                                { value: 'members', label: 'Member List' },
                                { value: 'fines', label: 'Fines Report' },
                            ]}
                        />

                        <Select
                            label="Time Period"
                            value={period}
                            onChange={setPeriod}
                            options={[
                                { value: 'day', label: 'Last 24 Hours' },
                                { value: 'month', label: 'Last Month' },
                                { value: 'year', label: 'Last Year' },
                            ]}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Export Format</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={exportToPDF}
                            disabled={exporting !== null}
                            className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex flex-col items-center gap-3">
                                {exporting === 'pdf' ? (
                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                ) : (
                                    <FileText className="w-10 h-10 text-red-500 group-hover:scale-110 transition-transform" />
                                )}
                                <div className="text-center">
                                    <p className="font-medium text-slate-900 dark:text-slate-100">PDF Document</p>
                                    <p className="text-sm text-slate-500">Best for printing</p>
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={exportToExcel}
                            disabled={exporting !== null}
                            className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex flex-col items-center gap-3">
                                {exporting === 'excel' ? (
                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                ) : (
                                    <Table className="w-10 h-10 text-green-600 group-hover:scale-110 transition-transform" />
                                )}
                                <div className="text-center">
                                    <p className="font-medium text-slate-900 dark:text-slate-100">Excel Spreadsheet</p>
                                    <p className="text-sm text-slate-500">Best for analysis</p>
                                </div>
                            </div>
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
