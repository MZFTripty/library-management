'use client'

import React from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

interface Column<T> {
    key: keyof T | string
    header: string
    sortable?: boolean
    render?: (item: T) => React.ReactNode
    className?: string
}

interface TableProps<T> {
    data: T[]
    columns: Column<T>[]
    sortColumn?: string
    sortDirection?: 'asc' | 'desc'
    onSort?: (column: string) => void
    loading?: boolean
    emptyMessage?: string
    onRowClick?: (item: T) => void
    rowKey: keyof T
}

function Table<T>({
    data,
    columns,
    sortColumn,
    sortDirection,
    onSort,
    loading = false,
    emptyMessage = 'No data available',
    onRowClick,
    rowKey,
}: TableProps<T>) {
    const renderSortIcon = (column: Column<T>) => {
        if (!column.sortable) return null

        const key = column.key as string
        if (sortColumn !== key) {
            return <ChevronsUpDown className="w-4 h-4 text-gray-400" />
        }

        return sortDirection === 'asc' ? (
            <ChevronUp className="w-4 h-4 text-indigo-600" />
        ) : (
            <ChevronDown className="w-4 h-4 text-indigo-600" />
        )
    }

    const getValue = (item: T, key: keyof T | string): React.ReactNode => {
        if (typeof key === 'string' && key.includes('.')) {
            const keys = key.split('.')
            let value: unknown = item
            for (const k of keys) {
                value = (value as Record<string, unknown>)?.[k]
            }
            return value as React.ReactNode
        }
        return item[key as keyof T] as React.ReactNode
    }

    if (loading) {
        return (
            <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                                >
                                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                        {[...Array(5)].map((_, rowIndex) => (
                            <tr key={rowIndex}>
                                {columns.map((_, colIndex) => (
                                    <td key={colIndex} className="px-6 py-4">
                                        <div className="h-4 w-full bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                </table>
                <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                    {emptyMessage}
                </div>
            </div>
        )
    }

    return (
        <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className={`
                  px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider
                  text-gray-500 dark:text-gray-400
                  ${column.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 select-none' : ''}
                  ${column.className || ''}
                `}
                                    onClick={() => {
                                        if (column.sortable && onSort) {
                                            onSort(column.key as string)
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.header}
                                        {renderSortIcon(column)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.map((item) => (
                            <tr
                                key={String(item[rowKey])}
                                className={`
                ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}
                transition-colors
              `}
                                onClick={() => onRowClick?.(item)}
                            >
                                {columns.map((column, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className={`px-6 py-4 text-sm text-gray-700 dark:text-gray-300 ${column.className || ''}`}
                                    >
                                        {column.render
                                            ? column.render(item)
                                            : getValue(item, column.key)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export { Table }
export type { Column, TableProps }
