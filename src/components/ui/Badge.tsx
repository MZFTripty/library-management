import React from 'react'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    size?: 'sm' | 'md'
    dot?: boolean
    className?: string
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'default',
    size = 'sm',
    dot = false,
    className = '',
}) => {
    const variants: Record<BadgeVariant, string> = {
        default: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
        primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    }

    const dotColors: Record<BadgeVariant, string> = {
        default: 'bg-slate-500',
        primary: 'bg-indigo-500',
        success: 'bg-green-500',
        warning: 'bg-amber-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    }

    const sizes = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
    }

    return (
        <span
            className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
        >
            {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
            {children}
        </span>
    )
}

export { Badge }
export type { BadgeProps, BadgeVariant }
